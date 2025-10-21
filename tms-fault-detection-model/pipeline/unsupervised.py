from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import cv2
from skimage.metrics import structural_similarity as ssim
from skimage.exposure import match_histograms
from scipy.ndimage import gaussian_filter, binary_opening, binary_closing, binary_fill_holes, label


@dataclass
class RegistrationResult:
    ok: bool
    method: str
    inliers: int | None
    H: np.ndarray | None


def read_image(path: Path) -> np.ndarray:
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(f"Image not found or unreadable: {path}")
    return img


def to_luma(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def resize_keep(img: np.ndarray, size: Tuple[int, int]) -> np.ndarray:
    h, w = img.shape[:2]
    tw, th = size
    scale = min(tw / w, th / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((th, tw, *img.shape[2:]), dtype=img.dtype)
    canvas[:nh, :nw] = resized
    return canvas


def histogram_match(src_gray: np.ndarray, ref_gray: np.ndarray) -> np.ndarray:
    matched = match_histograms(src_gray, ref_gray)
    matched = np.clip(matched, 0, 255).astype(np.uint8)
    return matched


def register_orb_ransac(ref: np.ndarray, src: np.ndarray) -> Tuple[np.ndarray, RegistrationResult]:
    # ORB features
    orb = cv2.ORB_create(5000)
    k1, d1 = orb.detectAndCompute(ref, None)
    k2, d2 = orb.detectAndCompute(src, None)
    if d1 is None or d2 is None or len(k1) < 10 or len(k2) < 10:
        return src, RegistrationResult(False, 'ORB_RANSAC', None, None)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    m = bf.match(d1, d2)
    m = sorted(m, key=lambda x: x.distance)[:200]
    pts1 = np.float32([k1[i.queryIdx].pt for i in m]).reshape(-1, 1, 2)
    pts2 = np.float32([k2[i.trainIdx].pt for i in m]).reshape(-1, 1, 2)
    H, mask = cv2.findHomography(pts2, pts1, cv2.RANSAC, 5.0)
    if H is None:
        return src, RegistrationResult(False, 'ORB_RANSAC', None, None)
    h, w = ref.shape[:2]
    warped = cv2.warpPerspective(src, H, (w, h))
    inliers = int(mask.sum()) if mask is not None else None
    return warped, RegistrationResult(True, 'ORB_RANSAC', inliers, H)


def register_ecc_affine(ref_gray: np.ndarray, src_gray: np.ndarray) -> Tuple[np.ndarray, RegistrationResult]:
    warp_mode = cv2.MOTION_AFFINE
    warp_matrix = np.eye(2, 3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    try:
        cc, warp_matrix = cv2.findTransformECC(ref_gray, src_gray, warp_matrix, warp_mode, criteria)
        h, w = ref_gray.shape
        aligned = cv2.warpAffine(src_gray, warp_matrix, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
        return aligned, RegistrationResult(True, 'ECC_AFFINE', None, warp_matrix)
    except cv2.error:
        return src_gray, RegistrationResult(False, 'ECC_AFFINE', None, None)


def fuse_diff_and_ssim(ref_gray: np.ndarray, src_gray: np.ndarray, smooth_sigma: float = 1.0, w_abs: float = 0.6, w_ssim: float = 0.4) -> np.ndarray:
    abs_diff = cv2.absdiff(ref_gray, src_gray).astype(np.float32)
    abs_diff = abs_diff / (abs_diff.max() + 1e-6)
    s_map = ssim(ref_gray, src_gray, data_range=255, full=True)[1]
    one_minus_ssim = 1.0 - s_map
    fused = w_abs * abs_diff + w_ssim * one_minus_ssim
    fused = gaussian_filter(fused, sigma=smooth_sigma)
    fused = np.clip(fused, 0.0, 1.0)
    return fused


def threshold_map(fused: np.ndarray, mode: str = 'percentile', value: float = 2.0) -> np.ndarray:
    if mode == 'percentile':
        thr = np.percentile(fused, 100 - value)
        mask = fused >= thr
    else:  # relative
        mask = fused >= float(value)
    return mask.astype(np.uint8)


def postprocess_mask(mask: np.ndarray, min_area_pct: float = 0.002) -> np.ndarray:
    mask = binary_fill_holes(mask).astype(np.uint8)
    mask = binary_opening(mask, iterations=1).astype(np.uint8)
    mask = binary_closing(mask, iterations=1).astype(np.uint8)
    h, w = mask.shape
    min_area = int(min_area_pct * h * w)
    labeled, n = label(mask)
    out = np.zeros_like(mask)
    for i in range(1, n + 1):
        area = int((labeled == i).sum())
        if area >= min_area:
            out[labeled == i] = 1
    return out


def regions_from_mask(mask: np.ndarray) -> List[Dict[str, Any]]:
    labeled, n = label(mask)
    regions: List[Dict[str, Any]] = []
    for i in range(1, n + 1):
        ys, xs = np.where(labeled == i)
        if ys.size == 0:
            continue
        x1, x2 = int(xs.min()), int(xs.max())
        y1, y2 = int(ys.min(),), int(ys.max())
        w, h = x2 - x1 + 1, y2 - y1 + 1
        area = int(ys.size)
        cx, cy = float(x1 + w / 2.0), float(y1 + h / 2.0)
        regions.append({
            'bbox': [x1, y1, w, h],
            'centroid': [cx, cy],
            'area_px': area,
        })
    return regions


def overlay_regions_on_image(img: np.ndarray, regions: List[Dict[str, Any]], alpha: float = 0.4) -> np.ndarray:
    overlay = img.copy()
    for r in regions:
        bbox = r.get('bbox_original_xywh') or r.get('bbox') or r.get('bbox_xywh')
        if not bbox:
            continue
        x, y, w, h = map(int, bbox)
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 255), 2)
    return cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)


def save_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def run_unsupervised_pair(baseline_path: Path, maintenance_path: Path, config: Dict[str, Any]) -> Dict[str, Any]:
    work_w, work_h = config.get('processing', {}).get('work_size', [640, 640])
    smooth_sigma = float(config.get('processing', {}).get('smooth_sigma', 1.0))
    thr_mode = config.get('thresholding', {}).get('mode', 'percentile')
    thr_value = float(config.get('thresholding', {}).get('value', 2.0))
    min_area_pct = float(config.get('thresholding', {}).get('min_area_pct', 0.002))
    w_abs, w_ssim = config.get('fuse_weights', [0.6, 0.4])

    base = read_image(baseline_path)
    maint = read_image(maintenance_path)
    base_r = resize_keep(base, (work_w, work_h))
    maint_r = resize_keep(maint, (work_w, work_h))
    base_g = to_luma(base_r)
    maint_g = to_luma(maint_r)
    maint_g = histogram_match(maint_g, base_g)

    # Registration
    warped_color, reg_res = None, None
    warped, reg_res = register_orb_ransac(base_g, maint_g)
    if not reg_res.ok:
        warped, reg_res = register_ecc_affine(base_g, maint_g)
    warped_color = cv2.cvtColor(warped, cv2.COLOR_GRAY2BGR) if warped.ndim == 2 else warped

    fused = fuse_diff_and_ssim(base_g, warped.astype(np.uint8), smooth_sigma, w_abs, w_ssim)
    mask = threshold_map(fused, thr_mode, thr_value)
    mask = postprocess_mask(mask, min_area_pct)
    regions = regions_from_mask(mask)

    maint_h, maint_w = maint.shape[:2]
    if maint_w == 0 or maint_h == 0:
        scale = 1.0
    else:
        scale = min(work_w / maint_w, work_h / maint_h)
    inv_scale = 1.0 / scale if scale > 0 else 1.0
    for region in regions:
        bbox_resized = region.get('bbox')
        if not bbox_resized:
            continue
        rx, ry, rw, rh = bbox_resized
        x1 = int(round(rx * inv_scale))
        y1 = int(round(ry * inv_scale))
        x2 = int(round((rx + rw) * inv_scale))
        y2 = int(round((ry + rh) * inv_scale))
        x1 = int(np.clip(x1, 0, maint_w - 1))
        y1 = int(np.clip(y1, 0, maint_h - 1))
        x2 = int(np.clip(x2, 1, maint_w))
        y2 = int(np.clip(y2, 1, maint_h))
        if x2 <= x1:
            x2 = min(maint_w, x1 + 1)
        if y2 <= y1:
            y2 = min(maint_h, y1 + 1)
        bbox_original = [x1, y1, max(1, x2 - x1), max(1, y2 - y1)]
    region['bbox_resized'] = bbox_resized
    region['bbox'] = bbox_original
    region['bbox_xywh'] = bbox_original
    region['bbox_xyxy'] = [x1, y1, x2, y2]
    region['bbox_original_xywh'] = bbox_original
    region['bbox_original_xyxy'] = [x1, y1, x2, y2]

    result = {
        'images': {
            'baseline': str(baseline_path),
            'maintenance': str(maintenance_path),
        },
        'params': {
            'work_size': [work_w, work_h],
            'smooth_sigma': smooth_sigma,
            'thresholding': {'mode': thr_mode, 'value': thr_value, 'min_area_pct': min_area_pct},
            'fuse_weights': [w_abs, w_ssim],
        },
        'registration': {
            'ok': reg_res.ok if reg_res else False,
            'method': reg_res.method if reg_res else None,
            'inliers': reg_res.inliers if reg_res else None,
        },
        'resize': {
            'work_size': [work_w, work_h],
            'original_size': [maint_w, maint_h],
            'scale': scale,
        },
        'anomalies': regions,
    }
    return result
