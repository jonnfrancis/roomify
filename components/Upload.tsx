import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useOutletContext } from "react-router";
import {
    PROGRESS_INTERVAL_MS,
    PROGRESS_STEP,
    REDIRECT_DELAY_MS,
} from "../lib/constants";
import type { Interface } from "readline";

interface UploadProps {
    onComplete?: (base64: string) => void;
};

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const processFile = useCallback((f: File) => {
        if (!isSignedIn) return;

        setFile(f);
        setProgress(0);

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string | null;
            const base64 = result ?? "";

            const interval = setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(100, prev + PROGRESS_STEP);
                    if (next >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            onComplete?.(base64);
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(f);
    }, [isSignedIn, onComplete]); 

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        if (!isSignedIn) return;
        const files = e.target.files;
        if (!files || files.length === 0) return;
        processFile(files[0]);
    };

    // const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    //     e.preventDefault();
    //     if (!isSignedIn) return;
    //     setIsDragging(true);
    // };

    const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        setIsDragging(false);
    };

    const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            processFile(droppedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? "is-dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn
                                ? "Drag and drop your floor plan here, or click to select a file"
                                : "Please sign in to upload your floor plan"}
                        </p>
                        <p className="help">Maximum file size 50 MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? <CheckCircle2 className="check" /> : <ImageIcon className="image" />}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }} />

                            <div className="status-text">
                                {progress < 100 ? `Analyzing Floor Plan... ${progress}%` : "Redirecting..."}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;