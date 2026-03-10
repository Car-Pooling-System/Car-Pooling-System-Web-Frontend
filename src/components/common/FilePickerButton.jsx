import { useRef } from "react";
import { Paperclip, UploadCloud } from "lucide-react";

export default function FilePickerButton({
    label = "Choose File",
    accept,
    multiple = false,
    onChange,
    fileText,
}) {
    const inputRef = useRef(null);

    const handleButtonClick = () => {
        // Allow selecting the same file again after an error/retry.
        if (inputRef.current) inputRef.current.value = "";
        inputRef.current?.click();
    };

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={(e) => onChange?.(e.target.files)}
            />
            <button
                type="button"
                onClick={handleButtonClick}
                className="w-full group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                    background: "linear-gradient(180deg, #ffffff 0%, #f5fbf7 100%)",
                    border: "1px dashed #9dc8ab",
                    color: "var(--color-text-primary)",
                    boxShadow: "0 4px 14px rgba(20, 55, 33, 0.05)",
                }}
            >
                <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                    style={{ backgroundColor: "rgba(19,236,91,0.14)", color: "var(--color-primary-dark)" }}
                >
                    <UploadCloud size={14} />
                </span>
                <Paperclip size={14} style={{ opacity: 0.65 }} />
                {label}
            </button>
            {fileText ? (
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {fileText}
                </p>
            ) : null}
        </div>
    );
}
