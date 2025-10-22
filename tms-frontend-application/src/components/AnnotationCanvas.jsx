import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Transformer } from 'react-konva';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import { 
    Save as SaveIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    ZoomOutMap as ResetZoomIcon
} from '@mui/icons-material';
import useImage from 'use-image';
import apiClient from '../config/api';
import './AnnotationCanvas.css';

/**
 * Canvas component for displaying and interacting with annotations
 */
const AnnotationCanvas = ({ 
    imageUrl, 
    annotations = [], 
    onAnnotationSelect, 
    onAnnotationCreate, 
    onAnnotationEdit,
    drawMode = 'view', // 'view' | 'draw' | 'edit'
    selectedAnnotationId = null
}) => {
    const [authenticatedImageUrl, setAuthenticatedImageUrl] = useState(null);
    const [image, status] = useImage(authenticatedImageUrl);
    const [scale, setScale] = useState(1);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [newBox, setNewBox] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [editingAnnotation, setEditingAnnotation] = useState(null); // Store temporary edits
    const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [cursorStyle, setCursorStyle] = useState('default');
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const transformerRef = useRef(null);
    const rectRefs = useRef({}); // Store refs to Rect elements only, not Groups

    // Load image with authentication
    useEffect(() => {
        if (!imageUrl) return;

        const loadAuthenticatedImage = async () => {
            try {
                console.log('[AnnotationCanvas] Loading image:', imageUrl);
                
                // If it's a Cloudinary URL, load directly without credentials
                if (imageUrl.includes('cloudinary.com')) {
                    setAuthenticatedImageUrl(imageUrl);
                    console.log('[AnnotationCanvas] Using Cloudinary URL directly');
                } else {
                    // For backend URLs, use authenticated request
                    const response = await apiClient.get(imageUrl, {
                        responseType: 'blob'
                    });
                    const blobUrl = URL.createObjectURL(response.data);
                    setAuthenticatedImageUrl(blobUrl);
                    console.log('[AnnotationCanvas] Image loaded with authentication');
                }
            } catch (error) {
                console.error('[AnnotationCanvas] Error loading image:', error);
            }
        };

        loadAuthenticatedImage();

        // Cleanup blob URL on unmount
        return () => {
            if (authenticatedImageUrl && !authenticatedImageUrl.includes('cloudinary.com')) {
                URL.revokeObjectURL(authenticatedImageUrl);
            }
        };
    }, [imageUrl]);

    // Debug image loading
    useEffect(() => {
        console.log('[AnnotationCanvas] Image URL:', imageUrl);
        console.log('[AnnotationCanvas] Authenticated URL:', authenticatedImageUrl);
        console.log('[AnnotationCanvas] Image status:', status);
        console.log('[AnnotationCanvas] Image loaded:', !!image);
    }, [imageUrl, authenticatedImageUrl, image, status]);

    useEffect(() => {
        if (containerRef.current) {
            const updateSize = () => {
                const containerWidth = containerRef.current.offsetWidth;
                const containerHeight = containerRef.current.offsetHeight || 600;
                setStageSize({ width: containerWidth, height: containerHeight });
            };
            updateSize();
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }
    }, []);

    useEffect(() => {
        if (image) {
            const scaleX = stageSize.width / image.width;
            const scaleY = stageSize.height / image.height;
            const fitScale = Math.min(scaleX, scaleY, 1);
            setScale(fitScale);
            
            // Center the image initially
            const imageWidth = image.width * fitScale * zoomLevel;
            const imageHeight = image.height * fitScale * zoomLevel;
            setStagePosition({
                x: (stageSize.width - imageWidth) / 2,
                y: (stageSize.height - imageHeight) / 2
            });
        }
    }, [image, stageSize]);

    // Attach transformer to selected annotation's Rect in edit mode
    useEffect(() => {
        if (drawMode === 'edit' && selectedAnnotationId && transformerRef.current) {
            const selectedRect = rectRefs.current[selectedAnnotationId];
            if (selectedRect) {
                transformerRef.current.nodes([selectedRect]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [drawMode, selectedAnnotationId]);

    // Reset editing annotation when switching modes or selections
    useEffect(() => {
        if (drawMode !== 'edit') {
            setEditingAnnotation(null);
        }
    }, [drawMode]);

    // Clear editingAnnotation when annotations are reloaded (after save)
    useEffect(() => {
        if (editingAnnotation) {
            // Check if the edited annotation exists in the new annotations with updated values
            const updatedAnnotation = annotations.find(a => a.id === editingAnnotation.id);
            if (updatedAnnotation && 
                updatedAnnotation.bboxX === editingAnnotation.bboxX &&
                updatedAnnotation.bboxY === editingAnnotation.bboxY &&
                updatedAnnotation.bboxWidth === editingAnnotation.bboxWidth &&
                updatedAnnotation.bboxHeight === editingAnnotation.bboxHeight) {
                // The changes have been saved, clear the editing state
                setEditingAnnotation(null);
            }
        }
    }, [annotations, editingAnnotation]);

    // Reset rect scale after editing annotation changes
    useEffect(() => {
        if (editingAnnotation && selectedAnnotationId) {
            const rect = rectRefs.current[selectedAnnotationId];
            if (rect) {
                // Reset any scale that might have been applied during transform
                rect.scaleX(1);
                rect.scaleY(1);
            }
        }
    }, [editingAnnotation, selectedAnnotationId]);

    const handleMouseDown = (e) => {
        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        
        // Check if clicked on background (not on any annotation)
        const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Image';
        
        if (drawMode === 'draw') {
            const adjustedPoint = {
                x: (point.x - stagePosition.x) / (scale * zoomLevel),
                y: (point.y - stagePosition.y) / (scale * zoomLevel)
            };
            setNewBox({ x: adjustedPoint.x, y: adjustedPoint.y, width: 0, height: 0 });
            setIsDrawing(true);
        } else if (clickedOnEmpty && drawMode !== 'edit') {
            // Start panning if clicked on background in view mode
            setIsPanning(true);
            setCursorStyle('grabbing');
        } else if (drawMode === 'edit' && clickedOnEmpty) {
            // In edit mode, allow panning when clicking outside annotations
            setIsPanning(true);
            setCursorStyle('grabbing');
        }
    };

    const handleMouseMove = (e) => {
        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        
        if (isDrawing && drawMode === 'draw') {
            const adjustedPoint = {
                x: (point.x - stagePosition.x) / (scale * zoomLevel),
                y: (point.y - stagePosition.y) / (scale * zoomLevel)
            };
            
            setNewBox({
                ...newBox,
                width: adjustedPoint.x - newBox.x,
                height: adjustedPoint.y - newBox.y
            });
        } else if (isPanning) {
            // Pan the stage
            const deltaX = e.evt.movementX;
            const deltaY = e.evt.movementY;
            
            setStagePosition(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));
        } else {
            // Update cursor based on position
            const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Image';
            if (drawMode === 'draw') {
                setCursorStyle('crosshair');
            } else if (clickedOnEmpty) {
                setCursorStyle('grab');
            } else {
                setCursorStyle('default');
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing && drawMode === 'draw') {
            setIsDrawing(false);
            
            if (newBox && Math.abs(newBox.width) > 10 && Math.abs(newBox.height) > 10) {
                // Normalize bbox (handle negative width/height)
                const normalizedBox = {
                    x: newBox.width < 0 ? newBox.x + newBox.width : newBox.x,
                    y: newBox.height < 0 ? newBox.y + newBox.height : newBox.y,
                    width: Math.abs(newBox.width),
                    height: Math.abs(newBox.height)
                };
                
                onAnnotationCreate(normalizedBox);
            }
            
            setNewBox(null);
        }
        
        if (isPanning) {
            setIsPanning(false);
            setCursorStyle(drawMode === 'draw' ? 'crosshair' : 'grab');
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        
        const stage = stageRef.current;
        const oldScale = zoomLevel;
        const pointer = stage.getPointerPosition();
        
        const mousePointTo = {
            x: (pointer.x - stagePosition.x) / oldScale,
            y: (pointer.y - stagePosition.y) / oldScale
        };
        
        // Zoom in/out with mouse wheel
        const scaleBy = 1.1;
        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        
        // Limit zoom between 0.5x and 10x
        const clampedScale = Math.max(0.5, Math.min(10, newScale));
        
        setZoomLevel(clampedScale);
        
        // Adjust position to zoom towards mouse pointer
        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale
        };
        
        setStagePosition(newPos);
    };

    const handleZoomIn = () => {
        const newScale = Math.min(10, zoomLevel * 1.2);
        setZoomLevel(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(0.5, zoomLevel / 1.2);
        setZoomLevel(newScale);
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        
        // Reset to center
        if (image) {
            const imageWidth = image.width * scale;
            const imageHeight = image.height * scale;
            setStagePosition({
                x: (stageSize.width - imageWidth) / 2,
                y: (stageSize.height - imageHeight) / 2
            });
        }
    };

    const getAnnotationColor = (annotation) => {
        // Red glow for selected annotation in edit mode
        if (drawMode === 'edit' && selectedAnnotationId === annotation.id) {
            return '#FF0000'; // Red for editing
        }
        
        if (annotation.source === 'AI_GENERATED') {
            return annotation.isActive ? '#00FF00' : '#888888'; // Green for AI, gray for inactive
        } else {
            return '#0080FF'; // Blue for user-added
        }
    };

    const handleAnnotationClick = (annotation) => {
        if (drawMode === 'view') {
            onAnnotationSelect(annotation);
        }
    };

    const handleAnnotationDragEnd = (e, annotation) => {
        if (drawMode !== 'edit') return;

        const group = e.target;
        // Get absolute position on stage
        const absolutePos = group.getAbsolutePosition();
        
        // Convert from screen coordinates to image coordinates
        const newPos = {
            x: (absolutePos.x - stagePosition.x) / (scale * zoomLevel),
            y: (absolutePos.y - stagePosition.y) / (scale * zoomLevel)
        };

        // Use editingAnnotation if it exists (preserves any size changes), otherwise use original annotation
        const baseAnnotation = editingAnnotation && editingAnnotation.id === annotation.id ? editingAnnotation : annotation;

        // Store in temporary state, don't save yet
        setEditingAnnotation({
            ...baseAnnotation,
            bboxX: Math.round(newPos.x),
            bboxY: Math.round(newPos.y)
        });
    };

    const handleTransformEnd = (e) => {
        if (drawMode !== 'edit' || !selectedAnnotationId) return;

        const rect = rectRefs.current[selectedAnnotationId];
        if (!rect) return;

        const scaleX = rect.scaleX();
        const scaleY = rect.scaleY();
        
        // Get the parent group to get position
        const group = rect.getParent();
        const annotation = annotations.find(a => a.id === selectedAnnotationId);
        
        if (annotation) {
            // Get absolute position on stage
            const absolutePos = group.getAbsolutePosition();
            
            // Convert from screen coordinates to image coordinates
            const imageX = (absolutePos.x - stagePosition.x) / (scale * zoomLevel);
            const imageY = (absolutePos.y - stagePosition.y) / (scale * zoomLevel);
            
            // Calculate new dimensions in image coordinates
            const newWidth = (rect.width() * scaleX) / scale;
            const newHeight = (rect.height() * scaleY) / scale;
            
            // Store in temporary state, don't save yet
            setEditingAnnotation({
                ...annotation,
                bboxX: Math.round(imageX),
                bboxY: Math.round(imageY),
                bboxWidth: Math.round(newWidth),
                bboxHeight: Math.round(newHeight)
            });

            // Don't reset scale and dimensions here - let the component re-render with new values
            rect.getLayer().batchDraw();
        }
    };

    const handleSaveEdit = async () => {
        if (editingAnnotation) {
            await onAnnotationEdit(editingAnnotation);
            // Don't clear editingAnnotation immediately - wait for reload to complete
            // This prevents the blink to original position
            // The useEffect will clear it when drawMode changes or component updates
        }
    };

    // Get the current annotation (either being edited or original)
    const getCurrentAnnotation = (annotation) => {
        if (editingAnnotation && editingAnnotation.id === annotation.id) {
            return editingAnnotation;
        }
        return annotation;
    };

    return (
        <div ref={containerRef} className="annotation-canvas-container" style={{ position: 'relative' }}>
            {/* Zoom controls */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 1,
                    padding: 0.5,
                    boxShadow: 2
                }}
            >
                <Tooltip title="Zoom In" placement="left">
                    <IconButton 
                        size="small" 
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 10}
                    >
                        <ZoomInIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Zoom Out" placement="left">
                    <IconButton 
                        size="small" 
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 0.5}
                    >
                        <ZoomOutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Reset Zoom" placement="left">
                    <IconButton 
                        size="small" 
                        onClick={handleResetZoom}
                    >
                        <ResetZoomIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Save button for edit mode */}
            {drawMode === 'edit' && editingAnnotation && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 70,
                        zIndex: 1000
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEdit}
                        size="small"
                    >
                        Save Changes
                    </Button>
                </Box>
            )}

            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                x={stagePosition.x}
                y={stagePosition.y}
                scaleX={zoomLevel}
                scaleY={zoomLevel}
                draggable={false}
                style={{ cursor: cursorStyle }}
            >
                <Layer>
                    {image && (
                        <KonvaImage
                            image={image}
                            width={image.width * scale}
                            height={image.height * scale}
                        />
                    )}

                    {/* Render existing annotations */}
                    {annotations.filter(a => a.isActive).map((annotation) => {
                        const currentAnnotation = getCurrentAnnotation(annotation);
                        const isEditing = drawMode === 'edit' && selectedAnnotationId === annotation.id;
                        const isInteractive = drawMode === 'view' || isEditing;
                        
                        return (
                            <Group
                                key={annotation.id}
                                x={currentAnnotation.bboxX * scale}
                                y={currentAnnotation.bboxY * scale}
                                draggable={isEditing}
                                onDragEnd={(e) => handleAnnotationDragEnd(e, annotation)}
                                listening={isInteractive}
                            >
                                <Rect
                                    ref={(node) => {
                                        if (node) {
                                            rectRefs.current[annotation.id] = node;
                                        }
                                    }}
                                    width={currentAnnotation.bboxWidth * scale}
                                    height={currentAnnotation.bboxHeight * scale}
                                    stroke={getAnnotationColor(annotation)}
                                    strokeWidth={(isEditing ? 4 : (selectedAnnotationId === annotation.id ? 3 : 2)) / zoomLevel}
                                    strokeScaleEnabled={false}
                                    shadowBlur={isEditing ? 20 / zoomLevel : 0}
                                    shadowColor={isEditing ? '#FF0000' : 'transparent'}
                                    shadowOpacity={isEditing ? 0.8 : 0}
                                    listening={isInteractive}
                                    onClick={() => handleAnnotationClick(annotation)}
                                    onTap={() => handleAnnotationClick(annotation)}
                                    onTransformEnd={handleTransformEnd}
                                />
                                <Text
                                    text={annotation.source === 'AI_GENERATED' ? `${annotation.faultType} (${(annotation.faultConfidence * 100).toFixed(0)}%)` : annotation.faultType}
                                    fontSize={14 / zoomLevel}
                                    fill={getAnnotationColor(annotation)}
                                    padding={2}
                                    y={-20 / zoomLevel}
                                    listening={false}
                                />
                            </Group>
                        );
                    })}

                    {/* Transformer for resizing in edit mode */}
                    {drawMode === 'edit' && (
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // Limit resize to minimum size
                                if (newBox.width < 20 || newBox.height < 20) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    )}

                    {/* Render new box being drawn */}
                    {newBox && (
                        <Rect
                            x={newBox.x * scale}
                            y={newBox.y * scale}
                            width={newBox.width * scale}
                            height={newBox.height * scale}
                            stroke="#FFFF00"
                            strokeWidth={2 / zoomLevel}
                            dash={[5 / zoomLevel, 5 / zoomLevel]}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default AnnotationCanvas;
