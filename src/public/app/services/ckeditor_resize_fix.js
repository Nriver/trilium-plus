const deferredObservers = new WeakSet();

/**
 * CKEditor updates the floating toolbar's grouping synchronously inside its
 * ResizeObserver callbacks. Resizing the editor (for example by toggling the
 * note tree) can therefore resize the toolbar while the observer is still
 * delivering notifications, which results in:
 *
 *   "ResizeObserver loop completed with undelivered notifications."
 *
 * Move the callback to the next animation frame. This keeps the toolbar
 * grouping behavior intact but runs the layout changes outside the observer
 * delivery cycle.
 */
function deferObserverCallback(observer) {
    if (!observer || deferredObservers.has(observer)) {
        return;
    }

    const originalCallback = observer._callback;

    if (typeof originalCallback !== 'function') {
        return;
    }

    // CKEditor shares one native ResizeObserver and keeps the callbacks in a
    // static map. Replace the callback there as well, otherwise it would still
    // be invoked synchronously.
    const callbacks = observer.constructor?._elementCallbacks?.get(observer._element);

    if (!callbacks || !callbacks.has(originalCallback)) {
        return;
    }

    const deferredCallback = entry => {
        window.requestAnimationFrame(() => {
            // The editor may have been destroyed while waiting for the frame.
            if (observer._element?.isConnected) {
                originalCallback(entry);
            }
        });
    };

    callbacks.delete(originalCallback);
    callbacks.add(deferredCallback);
    observer._callback = deferredCallback;
    deferredObservers.add(observer);
}

export default function fixCkeditorResizeLoops(editor) {
    try {
        if (editor.plugins.has('BalloonToolbar')) {
            const balloonToolbar = editor.plugins.get('BalloonToolbar');

            // The editable's observer changes the toolbar max-width, which can
            // immediately trigger toolbar re-grouping.
            deferObserverCallback(balloonToolbar._resizeObserver);

            // The toolbar's own observer re-groups items when its width changes.
            deferObserverCallback(balloonToolbar.toolbarView?._behavior?.resizeObserver);
        }

        if (editor.plugins.has('BlockToolbar')) {
            const blockToolbar = editor.plugins.get('BlockToolbar');

            deferObserverCallback(blockToolbar._resizeObserver);
            deferObserverCallback(blockToolbar.toolbarView?._behavior?.resizeObserver);
        }
    }
    catch (e) {
        // CKEditor internals are not public API. If their shape changes, keep
        // the editor functional instead of breaking note editing.
        console.warn('Could not apply the CKEditor resize observer fix', e);
    }
}
