import NoteContextAwareWidget from "./note_context_aware_widget.js";

// The padding is half of the scrolling container's height. Using a percentage
// avoids observing the scrolling container: writing the padding height can make
// a vertical scrollbar appear, which changes the container's content-box width
// and would immediately retrigger the observer ("ResizeObserver loop" error).
const TPL = `<div class="scroll-padding-widget" style="height: 50%;"></div>`;

export default class ScrollPaddingWidget extends NoteContextAwareWidget {
    isEnabled() {
        return super.isEnabled() && ["text", "code"].includes(this.note?.type);
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$widget.on("click", () =>
            this.triggerCommand('scrollToEnd', {ntxId: this.ntxId}));
    }
}
