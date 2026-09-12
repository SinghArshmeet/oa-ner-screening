import { useState, useEffect, useRef, useCallback } from 'react';

export function useCamera(isAuthenticated = false) {
  const [stream, setStream] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [sourceMode, setSourceMode] = useState('webcam'); // 'webcam' | 'sample' | 'upload'
  const [sampleVideoUrl, setSampleVideoUrl] = useState('/sample_gait_walk.mp4');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false); // Default to clean feed without overlay
  const [hudOpacity, setHudOpacity] = useState(85);
  const [isSecureContext, setIsSecureContext] = useState(true);

  const streamRef = useRef(null);

  // Clean up object URL when component unmounts or video changes
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        try {
          URL.revokeObjectURL(uploadedVideoUrl);
        } catch {}
      }
    };
  }, [uploadedVideoUrl]);

  // Check secure context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSec = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsSecureContext(Boolean(isSec));
    }
  }, []);

  // Enumerate cameras ONLY when user is authenticated
  const refreshDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devs.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate cameras:', e);
    }
  }, [isAuthenticated, selectedDeviceId]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshDevices();
    }
  }, [isAuthenticated, refreshDevices]);

  // Robust camera starter
  const startCamera = useCallback(async (deviceIdOverride) => {
    // Clear previous
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsWebcamActive(false);
    setCameraError(null);

    // Check MediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = !window.isSecureContext
        ? 'Camera access is blocked because you are browsing on an unencrypted network IP. Please open http://localhost:5173/ in your browser.'
        : 'navigator.mediaDevices.getUserMedia is not supported by your browser. Please use Chrome, Edge, or Firefox on http://localhost:5173.';
      setCameraError(err);
      return false;
    }

    const targetDevId = deviceIdOverride || selectedDeviceId;
    const constraintsList = [
      // 1. Device ID + Ideal HD
      targetDevId
        ? { video: { deviceId: { exact: targetDevId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }
        : null,
      // 2. Ideal HD without Device ID
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false },
      // 3. Fallback standard resolution
      { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      // 4. Basic video constraint (never fails due to resolution restrictions)
      { video: true, audio: false }
    ].filter(Boolean);

    let acquiredStream = null;
    let lastError = null;

    for (const c of constraintsList) {
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia(c);
        if (acquiredStream) break;
      } catch (err) {
        lastError = err;
        console.warn('Camera constraint attempt failed:', c, err.name, err.message);
      }
    }

    if (!acquiredStream) {
      console.error('All camera attempts failed:', lastError);
      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was blocked. Click the camera/tune icon in your browser address bar (next to the URL), change Camera to "Allow", and click Try Again.');
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        setCameraError('No webcam detected on this computer. You can connect a USB webcam or click "Sample Walk Clip" to test with reference patient video.');
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        setCameraError('Camera is already open in another application (Windows Camera, Teams, Zoom, Meet, etc.). Close other apps using the camera and click Try Again.');
      } else {
        setCameraError(`Camera error: ${lastError?.message || 'Could not access video feed'}`);
      }
      return false;
    }

    streamRef.current = acquiredStream;
    setStream(acquiredStream);
    setIsWebcamActive(true);
    setSourceMode('webcam');
    refreshDevices();
    return true;
  }, [selectedDeviceId, refreshDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsWebcamActive(false);
  }, []);

  const selectSample = useCallback((videoUrl) => {
    stopCamera();
    if (videoUrl) {
      setSampleVideoUrl(videoUrl);
    }
    setSourceMode('sample');
    setCameraError(null);
  }, [stopCamera]);

  const setUploadedVideo = useCallback((file) => {
    stopCamera();
    if (uploadedVideoUrl) {
      try {
        URL.revokeObjectURL(uploadedVideoUrl);
      } catch {}
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFile(file);
      setUploadedVideoUrl(url);
      setSourceMode('upload');
    } else {
      setUploadedFile(null);
      setUploadedVideoUrl(null);
    }
    setCameraError(null);
  }, [stopCamera, uploadedVideoUrl]);

  return {
    stream,
    streamRef,
    isWebcamActive,
    cameraError,
    setCameraError,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    sourceMode,
    setSourceMode,
    sampleVideoUrl,
    setSampleVideoUrl,
    uploadedVideoUrl,
    setUploadedVideoUrl,
    uploadedFile,
    setUploadedFile,
    setUploadedVideo,
    showOverlay,
    setShowOverlay,
    hudOpacity,
    setHudOpacity,
    isSecureContext,
    isSampleVideo: sourceMode === 'sample',
    startCamera,
    stopCamera,
    selectSample,
    switchToSampleVideo: selectSample
  };
}
