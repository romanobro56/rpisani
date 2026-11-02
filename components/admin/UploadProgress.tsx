import { mediaKindOf } from "@/lib/upload-client";
import type { UploadItem } from "./useUploads";

export function UploadTile({ item, onDismiss }: { item: UploadItem; onDismiss: () => void }) {
  return (
    <div className={`media-tile media-tile--uploading${item.error ? " has-error" : ""}`}>
      {item.preview ? (
        <img src={item.preview} alt="" className="media-tile__img" />
      ) : (
        <div className="media-tile__placeholder">
          <i className={`fas ${mediaKindOf(item.file) === "audio" ? "fa-music" : "fa-film"}`} aria-hidden="true"></i>
        </div>
      )}
      <div className="media-tile__progress">
        <div className="media-tile__bar" style={{ width: `${Math.round(item.progress * 100)}%` }} />
      </div>
      <div className="media-tile__status" title={item.error}>
        {item.error ? item.error : `${item.label} ${Math.round(item.progress * 100)}%`}
      </div>
      {item.error && (
        <button type="button" className="media-tile__remove" onClick={onDismiss} aria-label="Dismiss">
          <i className="fas fa-xmark" aria-hidden="true"></i>
        </button>
      )}
    </div>
  );
}
