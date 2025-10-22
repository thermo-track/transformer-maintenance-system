import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    IconButton, 
    List, 
    ListItem, 
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ButtonGroup,
    Divider,
    Tooltip,
    Collapse,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Comment as CommentIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    History as HistoryIcon,
    Add as AddIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import AnnotationService from '../services/AnnotationService';
import { getClassIdForFaultType, FAULT_TYPES } from '../utils/faultTypeUtils';
import './AnnotationPanel.css';

/**
 * Panel component for managing annotations
 */
const AnnotationPanel = ({
    aiDetections = [],
    userAnnotations = [],
    drawMode,
    setDrawMode,
    onDrawModeChange,
    selectedAnnotationId,
    onAnnotationSelect,
    onEditClick,
    onAnnotationsUpdate,
    inspectionId,
    userId,
    liveEditingAnnotation
}) => {
    // State hooks
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [currentComment, setCurrentComment] = useState('');
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [currentHistory, setCurrentHistory] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteComment, setDeleteComment] = useState('');
    const [annotationToDelete, setAnnotationToDelete] = useState(null);
    
    // Inline edit panel state
    const [expandedEditId, setExpandedEditId] = useState(null);
    const [editFaultType, setEditFaultType] = useState('');

    // Handlers
    const handleAcceptAI = async (anomaly) => {
        try {
            await AnnotationService.acceptAiDetection(anomaly.id, inspectionId, userId);
            onAnnotationsUpdate();
        } catch (error) {
            console.error('Error accepting AI detection:', error);
        }
    };

    const handleDelete = (anomaly) => {
        setAnnotationToDelete(anomaly);
        setDeleteComment('');
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteComment.trim()) {
            alert('Please provide a comment for deletion.');
            return;
        }
        try {
            await AnnotationService.deleteAnnotation(annotationToDelete.id, inspectionId, deleteComment, userId);
            setDeleteDialogOpen(false);
            setDeleteComment('');
            setAnnotationToDelete(null);
            onAnnotationsUpdate();
        } catch (error) {
            console.error('Error deleting annotation:', error);
        }
    };

    const handleAddComment = (anomaly) => {
        onAnnotationSelect(anomaly);
        setCurrentComment('');
        setCommentDialogOpen(true);
    };

    const handleCommentSubmit = async () => {
        if (selectedAnnotationId && currentComment.trim()) {
            try {
                await AnnotationService.addComment(selectedAnnotationId, inspectionId, currentComment, userId);
                setCommentDialogOpen(false);
                setCurrentComment('');
                onAnnotationsUpdate();
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    const handleViewHistory = async (anomaly) => {
        try {
            const history = await AnnotationService.getAnnotationHistory(anomaly.id);
            setCurrentHistory(history);
            setHistoryDialogOpen(true);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const handleDrawModeToggle = (mode) => {
        setDrawMode(mode);
        onDrawModeChange(mode);
    };
    
    const handleEditAnnotation = (anomaly) => {
        // Toggle inline edit panel
        if (expandedEditId === anomaly.id) {
            setExpandedEditId(null);
            handleDrawModeToggle('view');
        } else {
            setExpandedEditId(anomaly.id);
            setEditFaultType(anomaly.faultType);
            onAnnotationSelect(anomaly);
            handleDrawModeToggle('edit');
        }
    };
    
    const handleSaveEdit = async (anomaly) => {
        try {
            await AnnotationService.editAnnotation(anomaly.id, {
                inspectionId,
                userId,
                geometry: {
                    x: anomaly.bboxX,
                    y: anomaly.bboxY,
                    width: anomaly.bboxWidth,
                    height: anomaly.bboxHeight
                },
                classification: {
                    faultType: editFaultType,
                    confidence: anomaly.confidence || 1.0,
                    classId: getClassIdForFaultType(editFaultType)
                },
                comment: `Fault type changed to ${editFaultType}`
            });
            
            setExpandedEditId(null);
            handleDrawModeToggle('view');
            onAnnotationsUpdate();
        } catch (error) {
            console.error('Error saving annotation edit:', error);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        return 'error';
    };

    const renderAnnotationItem = (anomaly, isAI = false) => {
        const isExpanded = expandedEditId === anomaly.id;
        
        // Use live editing annotation if available, otherwise use the original
        const displayAnomaly = (liveEditingAnnotation && liveEditingAnnotation.id === anomaly.id) 
            ? liveEditingAnnotation 
            : anomaly;
        
        // Debug logging
        if (isExpanded && liveEditingAnnotation) {
            console.log('[AnnotationPanel] Rendering with live data:', displayAnomaly);
        }
        
        return (
            <Box key={anomaly.id}>
                <ListItem
                    selected={selectedAnnotationId === anomaly.id}
                    onClick={() => onAnnotationSelect(anomaly)}
                    sx={{ 
                        border: selectedAnnotationId === anomaly.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        backgroundColor: selectedAnnotationId === anomaly.id ? '#e3f2fd' : 'white',
                        cursor: 'pointer',
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: selectedAnnotationId === anomaly.id ? '#e3f2fd' : '#f5f5f5'
                        }
                    }}
                >
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Typography variant="subtitle2" fontWeight="medium" sx={{ flex: 1 }}>
                                    {anomaly.faultType || 'Unknown'}
                                </Typography>
                            </Box>
                        }
                        secondary={
                            <Box display="flex" flexDirection="column" gap={0.5}>
                                {isAI && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="caption" color="text.secondary">
                                            Confidence:
                                        </Typography>
                                        <Chip 
                                            label={`${(anomaly.faultConfidence * 100).toFixed(0)}%`} 
                                            size="small" 
                                            color={getConfidenceColor(anomaly.faultConfidence)}
                                            sx={{ height: 18, fontSize: '0.65rem' }}
                                        />
                                    </Box>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    {anomaly.createdBy ? `By: ${anomaly.createdBy}` : 'System generated'}
                                </Typography>
                            </Box>
                        }
                    />
                    <ListItemSecondaryAction>
                        <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-end">
                            {isAI && (
                                <Box display="flex" gap={0.5}>
                                    <Tooltip title="Accept" arrow>
                                        <IconButton 
                                            size="small" 
                                            color="success" 
                                            onClick={(e) => { e.stopPropagation(); handleAcceptAI(anomaly); }}
                                            sx={{ padding: '4px' }}
                                        >
                                            <CheckIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject" arrow>
                                        <IconButton 
                                            size="small" 
                                            color="error" 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(anomaly); }}
                                            sx={{ padding: '4px' }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                            <Box display="flex" gap={0.5}>
                                <Tooltip title="Edit" arrow>
                                    <IconButton 
                                        size="small" 
                                        color={isExpanded ? "primary" : "default"}
                                        onClick={(e) => { e.stopPropagation(); handleEditAnnotation(anomaly); }}
                                        sx={{ padding: '4px' }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Comment" arrow>
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => { e.stopPropagation(); handleAddComment(anomaly); }}
                                        sx={{ padding: '4px' }}
                                    >
                                        <CommentIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete" arrow>
                                    <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(anomaly); }}
                                        sx={{ padding: '4px' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="History" arrow>
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => { e.stopPropagation(); handleViewHistory(anomaly); }}
                                        sx={{ padding: '4px' }}
                                    >
                                        <HistoryIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </ListItemSecondaryAction>
                </ListItem>
                
                {/* Inline Edit Panel */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Paper 
                        elevation={2}
                        sx={{ 
                            m: 2, 
                            mt: 0, 
                            p: 2, 
                            border: '1px solid #1976d2',
                            backgroundColor: '#f5f5f5'
                        }}
                    >
                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                            Edit Annotation
                        </Typography>
                        
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel id={`fault-type-edit-${anomaly.id}`}>Fault Type</InputLabel>
                            <Select
                                labelId={`fault-type-edit-${anomaly.id}`}
                                value={editFaultType}
                                onChange={(e) => setEditFaultType(e.target.value)}
                                label="Fault Type"
                            >
                                {FAULT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: 'white' }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                Bounding Box Coordinates (Live)
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>X:</strong> {Math.round(displayAnomaly.bboxX)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Y:</strong> {Math.round(displayAnomaly.bboxY)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Width:</strong> {Math.round(displayAnomaly.bboxWidth)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">
                                        <strong>Height:</strong> {Math.round(displayAnomaly.bboxHeight)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                        
                        <Box display="flex" gap={1} justifyContent="flex-end">
                            <Button
                                size="small"
                                onClick={() => {
                                    setExpandedEditId(null);
                                    handleDrawModeToggle('view');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={() => handleSaveEdit(displayAnomaly)}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Paper>
                </Collapse>
            </Box>
        );
    };

    return (
        <Card className="annotation-panel">
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Annotations</Typography>
                    <ButtonGroup size="small" variant="outlined">
                        <Button 
                            variant={drawMode === 'view' ? 'contained' : 'outlined'}
                            onClick={() => handleDrawModeToggle('view')}
                        >
                            View
                        </Button>
                        <Button 
                            variant={drawMode === 'draw' ? 'contained' : 'outlined'}
                            onClick={() => handleDrawModeToggle('draw')}
                            startIcon={<AddIcon />}
                        >
                            Draw
                        </Button>
                    </ButtonGroup>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    AI Detections ({aiDetections.length})
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                    {aiDetections.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">No AI detections</Typography>
                    ) : (
                        aiDetections.map(anomaly => renderAnnotationItem(anomaly, true))
                    )}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    User Annotations ({userAnnotations.length})
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {userAnnotations.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">No user annotations</Typography>
                    ) : (
                        userAnnotations.map(anomaly => renderAnnotationItem(anomaly, false))
                    )}
                </List>

                {/* Comment Dialog */}
                <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Add Comment</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Comment"
                            fullWidth
                            multiline
                            rows={4}
                            value={currentComment}
                            onChange={(e) => setCurrentComment(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCommentSubmit} variant="contained" disabled={!currentComment.trim()}>Submit</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Delete Annotation</DialogTitle>
                    <DialogContent>
                        <Typography gutterBottom>
                            Please provide a comment for deleting this annotation:
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Delete Comment (required)"
                            fullWidth
                            multiline
                            rows={3}
                            value={deleteComment}
                            onChange={(e) => setDeleteComment(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={!deleteComment.trim()}>Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* History Dialog */}
                <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Annotation History</DialogTitle>
                    <DialogContent>
                        <List>
                            {currentHistory.map((action, index) => (
                                <ListItem key={index} divider>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" gap={1} alignItems="center">
                                                <Chip label={action.actionType} size="small" />
                                                <Typography variant="body2">{action.username}</Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="caption" display="block">
                                                    {new Date(action.actionTimestamp).toLocaleString()}
                                                </Typography>
                                                {action.comment && (
                                                    <Typography variant="body2" color="textPrimary">
                                                        {action.comment}
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default AnnotationPanel;
