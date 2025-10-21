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
    Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import AnnotationCanvas from '../components/AnnotationCanvas';
import AnnotationPanel from '../components/AnnotationPanel';
import AnnotationService from '../services/AnnotationService';
import './AnnotationPage.css';

/**
 * Page for viewing and editing annotations
 */
const AnnotationPage = () => {
    const { inspectionId } = useParams();
    const navigate = useNavigate();
    
    const [annotations, setAnnotations] = useState([]);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [drawMode, setDrawMode] = useState('view');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    
    // Mock user ID - in real app, get from auth context
    const userId = 1;

    useEffect(() => {
        loadAnnotations();
    }, [inspectionId]);

    const loadAnnotations = async () => {
        try {
            setLoading(true);
            const data = await AnnotationService.getAnnotations(inspectionId);
            
            // Combine all annotations
            const allAnnotations = [
                ...(data.aiDetections || []),
                ...(data.userAnnotations || []),
                ...(data.inactiveDetections || [])
            ];
            
            setAnnotations(allAnnotations);
            
            // TODO: Get image URL from inspection data
            // For now, using a placeholder
            setImageUrl('/api/inspections/' + inspectionId + '/image');
            
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
        try {
            // Show dialog to get classification
            const faultType = prompt('Enter fault type:') || 'Unknown';
            const confidence = parseFloat(prompt('Enter confidence (0-1):') || '0.8');
            
            await AnnotationService.createAnnotation({
                inspectionId: parseInt(inspectionId),
                userId,
                geometry: bbox,
                classification: {
                    faultType,
                    confidence,
                    classId: 0
                },
                comment: 'User-created annotation'
            });
            
            showSnackbar('Annotation created successfully', 'success');
            loadAnnotations();
            setDrawMode('view');
        } catch (err) {
            console.error('Error creating annotation:', err);
            showSnackbar('Failed to create annotation', 'error');
        }
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

    const handleDrawModeChange = (mode) => {
        setDrawMode(mode);
        if (mode === 'draw' || mode === 'edit') {
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
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 2, height: '70vh' }}>
                        <AnnotationCanvas
                            imageUrl={imageUrl}
                            annotations={annotations.filter(a => a.isActive)}
                            selectedAnnotationId={selectedAnnotationId}
                            onAnnotationSelect={handleAnnotationSelect}
                            onAnnotationCreate={handleAnnotationCreate}
                            onAnnotationEdit={handleAnnotationEdit}
                            drawMode={drawMode}
                        />
                    </Paper>
                </Grid>

                {/* Annotation Panel */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ height: '70vh', overflow: 'hidden' }}>
                        <AnnotationPanel
                            inspectionId={parseInt(inspectionId)}
                            userId={userId}
                            annotations={annotations}
                            selectedAnnotationId={selectedAnnotationId}
                            onAnnotationSelect={handleAnnotationSelect}
                            onAnnotationsUpdate={loadAnnotations}
                            onDrawModeChange={handleDrawModeChange}
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
        </Box>
    );
};

export default AnnotationPage;
