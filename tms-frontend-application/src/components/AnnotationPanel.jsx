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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ButtonGroup,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Comment as CommentIcon,
    Check as CheckIcon,
    History as HistoryIcon,
    Add as AddIcon
} from '@mui/icons-material';
import AnnotationService from '../services/AnnotationService';
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
    userId
}) => {
    // State hooks
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [currentComment, setCurrentComment] = useState('');
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [currentHistory, setCurrentHistory] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteComment, setDeleteComment] = useState('');
    const [annotationToDelete, setAnnotationToDelete] = useState(null);

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
        // Select the annotation first
        onAnnotationSelect(anomaly);
        // Then switch to edit mode
        handleDrawModeToggle('edit');
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'success';
        if (confidence >= 0.6) return 'warning';
        return 'error';
    };

    const renderAnnotationItem = (anomaly, isAI = false) => (
        <ListItem
            key={anomaly.id}
            selected={selectedAnnotationId === anomaly.id}
            onClick={() => onAnnotationSelect(anomaly)}
            sx={{ 
                border: selectedAnnotationId === anomaly.id ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: 1,
                mb: 1,
                backgroundColor: selectedAnnotationId === anomaly.id ? '#e3f2fd' : 'white',
                cursor: 'pointer'
            }}
        >
            <ListItemText
                primary={
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                            {anomaly.faultType || 'Unknown'}
                        </Typography>
                        {isAI && (
                            <>
                                <Chip label={`${(anomaly.faultConfidence * 100).toFixed(0)}%`} size="small" color={getConfidenceColor(anomaly.faultConfidence)} />
                                <Chip label="AI" size="small" color="success" variant="outlined" />
                            </>
                        )}
                    </Box>
                }
                secondary={
                    <Typography variant="caption" color="textSecondary">
                        {anomaly.createdBy ? `Created by: ${anomaly.createdBy}` : 'AI Generated'}
                    </Typography>
                }
            />
            <Box display="flex" gap={0.5}>
                {isAI && (
                    <Tooltip title="Accept">
                        <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAcceptAI(anomaly); }}>
                            <CheckIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEditAnnotation(anomaly); }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Comment">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleAddComment(anomaly); }}>
                        <CommentIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(anomaly); }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="History">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleViewHistory(anomaly); }}>
                        <HistoryIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </ListItem>
    );

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
