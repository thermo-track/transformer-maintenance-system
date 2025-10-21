import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
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
    const [image] = useImage(imageUrl);
    const [scale, setScale] = useState(1);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [newBox, setNewBox] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const stageRef = useRef(null);
    const containerRef = useRef(null);

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
            setScale(Math.min(scaleX, scaleY, 1));
        }
    }, [image, stageSize]);

    const handleMouseDown = (e) => {
        if (drawMode !== 'draw') return;

        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        setNewBox({ x: point.x / scale, y: point.y / scale, width: 0, height: 0 });
        setIsDrawing(true);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || drawMode !== 'draw') return;

        const stage = stageRef.current;
        const point = stage.getPointerPosition();
        
        setNewBox({
            ...newBox,
            width: point.x / scale - newBox.x,
            height: point.y / scale - newBox.y
        });
    };

    const handleMouseUp = () => {
        if (!isDrawing || drawMode !== 'draw') return;

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
    };

    const getAnnotationColor = (annotation) => {
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

        const newPos = {
            x: e.target.x() / scale,
            y: e.target.y() / scale
        };

        onAnnotationEdit({
            ...annotation,
            bboxX: Math.round(newPos.x),
            bboxY: Math.round(newPos.y)
        });
    };

    const handleTransformEnd = (e, annotation) => {
        if (drawMode !== 'edit') return;

        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onAnnotationEdit({
            ...annotation,
            bboxX: Math.round(node.x() / scale),
            bboxY: Math.round(node.y() / scale),
            bboxWidth: Math.round(annotation.bboxWidth * scaleX),
            bboxHeight: Math.round(annotation.bboxHeight * scaleY)
        });
    };

    return (
        <div ref={containerRef} className="annotation-canvas-container">
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{ cursor: drawMode === 'draw' ? 'crosshair' : 'default' }}
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
                    {annotations.filter(a => a.isActive).map((annotation) => (
                        <Group
                            key={annotation.id}
                            x={annotation.bboxX * scale}
                            y={annotation.bboxY * scale}
                            draggable={drawMode === 'edit' && selectedAnnotationId === annotation.id}
                            onDragEnd={(e) => handleAnnotationDragEnd(e, annotation)}
                            onTransformEnd={(e) => handleTransformEnd(e, annotation)}
                        >
                            <Rect
                                width={annotation.bboxWidth * scale}
                                height={annotation.bboxHeight * scale}
                                stroke={getAnnotationColor(annotation)}
                                strokeWidth={selectedAnnotationId === annotation.id ? 3 : 2}
                                listening={drawMode !== 'draw'}
                                onClick={() => handleAnnotationClick(annotation)}
                                onTap={() => handleAnnotationClick(annotation)}
                            />
                            <Text
                                text={`${annotation.faultType} (${(annotation.faultConfidence * 100).toFixed(0)}%)`}
                                fontSize={12 / scale}
                                fill={getAnnotationColor(annotation)}
                                padding={3}
                                y={-15 / scale}
                            />
                        </Group>
                    ))}

                    {/* Render new box being drawn */}
                    {newBox && (
                        <Rect
                            x={newBox.x * scale}
                            y={newBox.y * scale}
                            width={newBox.width * scale}
                            height={newBox.height * scale}
                            stroke="#FFFF00"
                            strokeWidth={2}
                            dash={[5, 5]}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default AnnotationCanvas;
