import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  showTimed(actions: { onShow: () => void; onHide: () => void; onComplete?: () => void }, delay = 50, visibleMs = 2000, totalMs = 2500) {
    // entrance
    setTimeout(() => actions.onShow(), delay);
    // start hide
    setTimeout(() => actions.onHide(), visibleMs);
    // complete
    setTimeout(() => actions.onComplete?.(), totalMs);
  }

  /**
   * Standardized success toast for form submissions. Accepts an optional onComplete callback.
   */
  showSuccess(actions?: { onShow?: () => void; onHide?: () => void; onComplete?: () => void }) {
    this.showTimed({ onShow: actions?.onShow ?? (() => {}), onHide: actions?.onHide ?? (() => {}), onComplete: actions?.onComplete });
  }

  /**
   * Standardized thumbnail success toast. Accepts optional callbacks.
   */
  showThumbnailSuccess(actions?: { onShow?: () => void; onHide?: () => void; onComplete?: () => void }) {
    this.showTimed({ onShow: actions?.onShow ?? (() => {}), onHide: actions?.onHide ?? (() => {}), onComplete: actions?.onComplete });
  }
}
