import axios from 'axios';
import { useState, useEffect } from 'react';

import { Lock, Error, Settings, CheckCircle } from '@mui/icons-material';
import {
    Box,
    Card,
    Chip,
    Modal,
    Alert,
    Stack,
    Button,
    Select,
    MenuItem,
    TextField,
    Typography,
    InputLabel,
    FormControl,
    CardContent,
    CircularProgress,
} from '@mui/material';

import { HOST_API } from 'src/config-global';

interface OpenAIModel {
    id: string;
    name: string;
    description: string;
    costLevel: string;
}

interface OpenAIConfig {
    apiKey: string;
    model: string;
}

interface OpenAIConfigModalProps {
    open: boolean;
    onClose: () => void;
    onConfigSet: (config: OpenAIConfig | null) => void;
    initialConfig?: OpenAIConfig | null;
}

const getCostLevelColor = (costLevel: string) => {
    switch (costLevel) {
        case 'Low':
            return 'success';
        case 'Low-Medium':
            return 'info';
        case 'Medium':
            return 'warning';
        case 'Medium-High':
            return 'warning';
        case 'High':
            return 'error';
        default:
            return 'default';
    }
};

export default function OpenAIConfigModal({
    open,
    onClose,
    onConfigSet,
    initialConfig
}: OpenAIConfigModalProps) {
    const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
    const [selectedModel, setSelectedModel] = useState(initialConfig?.model || 'gpt-4o');
    const [models, setModels] = useState<OpenAIModel[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [validationSuccess, setValidationSuccess] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(true);

    // Load available models on component mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                const response = await axios.get(`${HOST_API}/openai/models`);
                setModels(response.data);
            } catch (error) {
                console.error('Failed to load models:', error);
            } finally {
                setModelsLoading(false);
            }
        };

        if (open) {
            loadModels();
        }
    }, [open]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open && initialConfig) {
            setApiKey(initialConfig.apiKey);
            setSelectedModel(initialConfig.model);
        }
        if (!open) {
            setValidationError(null);
            setValidationSuccess(false);
        }
    }, [open, initialConfig]);

    const handleValidate = async () => {
        if (!apiKey.trim()) {
            setValidationError('Please enter an API key');
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        setValidationSuccess(false);

        try {
            await axios.post(`${HOST_API}/openai/validate`, {
                apiKey: apiKey.trim(),
                model: selectedModel,
            });

            setValidationSuccess(true);
            setValidationError(null);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Invalid API key or configuration';
            setValidationError(errorMessage);
            setValidationSuccess(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = () => {
        if (!validationSuccess) {
            setValidationError('Please validate your configuration first');
            return;
        }

        const config = {
            apiKey: apiKey.trim(),
            model: selectedModel,
        };

        // Save to sessionStorage for persistence
        sessionStorage.setItem('openaiConfig', JSON.stringify(config));

        onConfigSet(config);
        onClose();
    };

    const handleUseDefault = () => {
        // Clear any saved config
        sessionStorage.removeItem('openaiConfig');
        onConfigSet(null);
        onClose();
    };

    const isFormValid = apiKey.trim() && selectedModel;

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Settings color="primary" />
                            <Typography variant="h5">OpenAI Configuration</Typography>
                        </Box>

                        <Alert severity="info">
                            <Typography variant="body2">
                                Configure your own OpenAI API key to use your preferred model and manage your own costs.
                                Leave empty to use the system default (GPT-4o).
                            </Typography>
                        </Alert>

                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    API Key
                                </Typography>
                                <TextField
                                    fullWidth
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    InputProps={{
                                        startAdornment: <Lock color="action" sx={{ mr: 1 }} />,
                                    }}
                                    helperText="Your API key will be stored securely in your browser session"
                                />
                            </Box>

                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Model
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Select Model</InputLabel>
                                    <Select
                                        value={selectedModel}
                                        label="Select Model"
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        disabled={modelsLoading}
                                    >
                                        {models.map((model) => (
                                            <MenuItem key={model.id} value={model.id}>
                                                <Box sx={{ width: '100%' }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body1">{model.name}</Typography>
                                                        <Chip
                                                            label={model.costLevel}
                                                            size="small"
                                                            color={getCostLevelColor(model.costLevel)}
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {model.description}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {validationError && (
                                <Alert severity="error" icon={<Error />}>
                                    {validationError}
                                </Alert>
                            )}

                            {validationSuccess && (
                                <Alert severity="success" icon={<CheckCircle />}>
                                    Configuration validated successfully!
                                </Alert>
                            )}

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    onClick={handleValidate}
                                    disabled={!isFormValid || isValidating}
                                    fullWidth
                                >
                                    {isValidating ? (
                                        <>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Validating...
                                        </>
                                    ) : (
                                        'Validate Configuration'
                                    )}
                                </Button>
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    onClick={handleUseDefault}
                                    fullWidth
                                >
                                    Use System Default
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    disabled={!validationSuccess}
                                    fullWidth
                                >
                                    Save Configuration
                                </Button>
                            </Stack>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Modal>
    );
} 