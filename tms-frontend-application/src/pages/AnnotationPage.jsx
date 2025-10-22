import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Grid, 
    Paper, 
    Typography, 
    CircularProgress,
    Alert,
    Snackbar,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AnnotationCanvas from '../components/AnnotationCanvas';
import AnnotationPanel from '../components/AnnotationPanel';
import AnnotationService from '../services/AnnotationService';
import { getClassIdForFaultType, FAULT_TYPES } from '../utils/faultTypeUtils';
import apiClient from '../config/api';
import './AnnotationPage.css';

/**
 * Page for viewing and editing annotations
 */
const AnnotationPage = () => {
    const { inspectionId } = useParams();
    const navigate = useNavigate();
    
    const [annotations, setAnnotations] = useState([]);
    const [aiDetections, setAiDetections] = useState([]);
    const [userAnnotations, setUserAnnotations] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [drawMode, setDrawMode] = useState('view');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    
    // Dialog state for new annotation
    const [newAnnotationDialog, setNewAnnotationDialog] = useState(false);
    const [pendingBbox, setPendingBbox] = useState(null);
    const [selectedFaultType, setSelectedFaultType] = useState('');
    
    // Live editing annotation state (for live updates before save)
    const [liveEditingAnnotation, setLiveEditingAnnotation] = useState(null);
    
    // Mock user ID - in real app, get from auth context
    const userId = 1;

    useEffect(() => {
        loadAnnotations();
    }, [inspectionId]);
    
    // Clear live editing annotation when annotations update
    useEffect(() => {
        if (liveEditingAnnotation) {
            // Check if the editing annotation still exists in the updated annotations
            const stillExists = annotations.find(a => a.id === liveEditingAnnotation.id);
            if (!stillExists) {
                setLiveEditingAnnotation(null);
            }
        }
    }, [annotations]);

    const loadAnnotations = async () => {
        try {
            setLoading(true);
            const data = await AnnotationService.getAnnotations(inspectionId);
            
            console.log('[AnnotationService] Annotations fetched:', data);
            
            // Set separate state for AI detections and user annotations
            setAiDetections(data.aiDetections || []);
            setUserAnnotations(data.userAnnotations || []);
            
            // Combine all annotations for canvas display
            const allAnnotations = [
                ...(data.aiDetections || []),
                ...(data.userAnnotations || []),
                ...(data.inactiveDetections || [])
            ];
            
            setAnnotations(allAnnotations);
            
            // Get cloud image URL from backend
            const imageResponse = await apiClient.get(`/api/inspections/${inspectionId}/images/cloud-image-url`);
            if (imageResponse.data && imageResponse.data.cloudImageUrl) {
                setImageUrl(imageResponse.data.cloudImageUrl);
            } else {
                setError('No thermal image found for this inspection');
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error loading annotations:', err);
            setError('Failed to load annotations');
            setLoading(false);
        }
    };

    const handleAnnotationSelect = (annotation) => {
        setSelectedAnnotationId(annotation?.id || null);
    };

    const handleAnnotationCreate = async (bbox) => {
        // Store the bbox and show dialog
        setPendingBbox(bbox);
        setSelectedFaultType('');
        setNewAnnotationDialog(true);
    };
    
    const handleConfirmAnnotation = async () => {
        if (!selectedFaultType) {
            showSnackbar('Please select a fault type', 'warning');
            return;
        }
        
        try {
            await AnnotationService.createAnnotation({
                inspectionId: parseInt(inspectionId),
                userId,
                geometry: pendingBbox,
                classification: {
                    faultType: selectedFaultType,
                    confidence: 1.0, // Default confidence for user annotations
                    classId: getClassIdForFaultType(selectedFaultType)
                },
                comment: 'User-created annotation'
            });
            
            setNewAnnotationDialog(false);
            setPendingBbox(null);
            setSelectedFaultType('');
            showSnackbar('Annotation created successfully', 'success');
            loadAnnotations();
            setDrawMode('view');
        } catch (err) {
            console.error('Error creating annotation:', err);
            showSnackbar('Failed to create annotation', 'error');
        }
    };
    
    const handleCancelAnnotation = () => {
        setNewAnnotationDialog(false);
        setPendingBbox(null);
        setSelectedFaultType('');
    };

    const handleAnnotationEdit = async (editedAnnotation) => {
        try {
            await AnnotationService.editAnnotation(editedAnnotation.id, {
                inspectionId: parseInt(inspectionId),
                userId,
                geometry: {
                    x: editedAnnotation.bboxX,
                    y: editedAnnotation.bboxY,
                    width: editedAnnotation.bboxWidth,
                    height: editedAnnotation.bboxHeight
                },
                comment: 'Annotation edited by user'
            });
            
            showSnackbar('Annotation updated successfully', 'success');
            loadAnnotations();
        } catch (err) {
            console.error('Error editing annotation:', err);
            showSnackbar('Failed to update annotation', 'error');
        }
    };
    
    const handleAnnotationUpdate = (updatedAnnotation) => {
        // Live update during drag/resize (before save)
        console.log('[AnnotationPage] Live update:', updatedAnnotation);
        setLiveEditingAnnotation(updatedAnnotation);
    };

    const handleDrawModeChange = (mode) => {
        setDrawMode(mode);
        // Only clear selection when entering draw mode, not edit mode
        if (mode === 'draw') {
            setSelectedAnnotationId(null);
        }
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box className="annotation-page" p={3}>
            <Box mb={2} display="flex" alignItems="center" gap={2}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate(-1)}
                    variant="outlined"
                >
                    Back
                </Button>
                <Typography variant="h4">
                    Annotation Editor - Inspection #{inspectionId}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Canvas Area */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={3} sx={{ p: 2, height: '70vh' }}>
                        <AnnotationCanvas
                            imageUrl={imageUrl}
                            annotations={annotations.filter(a => a.isActive)}
                            selectedAnnotationId={selectedAnnotationId}
                            onAnnotationSelect={handleAnnotationSelect}
                            onAnnotationCreate={handleAnnotationCreate}
                            onAnnotationEdit={handleAnnotationEdit}
                            onAnnotationUpdate={handleAnnotationUpdate}
                            drawMode={drawMode}
                        />
                    </Paper>
                </Grid>

                {/* Annotation Panel */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={3} sx={{ height: '70vh', overflow: 'hidden' }}>
                        <AnnotationPanel
                            inspectionId={parseInt(inspectionId)}
                            userId={userId}
                            aiDetections={aiDetections}
                            userAnnotations={userAnnotations}
                            drawMode={drawMode}
                            setDrawMode={setDrawMode}
                            selectedAnnotationId={selectedAnnotationId}
                            liveEditingAnnotation={liveEditingAnnotation}
                            onAnnotationSelect={handleAnnotationSelect}
                            onAnnotationsUpdate={loadAnnotations}
                            onDrawModeChange={handleDrawModeChange}
                            onEditClick={() => setDrawMode('edit')}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* New Annotation Dialog */}
            <Dialog open={newAnnotationDialog} onClose={handleCancelAnnotation} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Annotation</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel id="fault-type-label">Fault Type</InputLabel>
                            <Select
                                labelId="fault-type-label"
                                value={selectedFaultType}
                                onChange={(e) => setSelectedFaultType(e.target.value)}
                                label="Fault Type"
                            >
                                {FAULT_TYPES.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelAnnotation}>Cancel</Button>
                    <Button 
                        onClick={handleConfirmAnnotation} 
                        variant="contained" 
                        disabled={!selectedFaultType}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AnnotationPage;
