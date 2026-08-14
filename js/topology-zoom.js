function initializeTopologyZoom() {

    document
        .querySelectorAll(".network-topology-viewer .d2 svg")
        .forEach((svg) => {

            // Prevent initialization more than once
            if (svg.dataset.topologyZoomInitialized === "true") {
                return;
            }

            svg.dataset.topologyZoomInitialized = "true";


            // ============================================================
            // ORIGINAL VIEWBOX
            // ============================================================

            const base = svg.viewBox.baseVal;

            if (!base.width || !base.height) {
                return;
            }


            /*
             * Small amount of permanent breathing room around
             * the original D2 drawing.
             */
            const padding = 8;


            const originalViewBox = {
                x: base.x - padding,
                y: base.y - padding,
                width: base.width + padding * 2,
                height: base.height + padding * 2
            };


            let viewBox = {
                ...originalViewBox
            };


            /*
             * Zoom limits
             *
             * 1 = 100%
             * 4 = 400%
             */
            const maxZoom = 4;
            const minZoom = 1;


            /*
             * Allow the SVG to remain centered and maintain
             * its aspect ratio inside the viewer.
             */
            svg.setAttribute(
                "preserveAspectRatio",
                "xMidYMid meet"
            );


            // ============================================================
            // APPLY VIEWBOX
            // ============================================================

            function applyViewBox() {

                svg.setAttribute(
                    "viewBox",
                    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
                );

            }


            // ============================================================
            // RESET / FIT TO SCREEN
            // ============================================================

            function resetView() {

                viewBox = {
                    ...originalViewBox
                };

                applyViewBox();

            }


            // ============================================================
            // PAN LIMITS + OVERSCROLL
            // ============================================================

            function constrainPan() {

                /*
                 * Determine current zoom level.
                 *
                 * 1 = original fitted view
                 * 2 = 200%
                 * 3 = 300%
                 */
                const zoom =
                    originalViewBox.width /
                    viewBox.width;


                /*
                 * Allow some movement past the normal
                 * diagram boundaries while zoomed in.
                 *
                 * 0.08 = 8% of the current viewport.
                 */
                const overscrollRatio = 0.08;


                /*
                 * At the normal 100% fitted view we don't
                 * allow overscroll.
                 */
                const overscrollX =
                    zoom > 1.01
                        ? viewBox.width * overscrollRatio
                        : 0;

                const overscrollY =
                    zoom > 1.01
                        ? viewBox.height * overscrollRatio
                        : 0;


                /*
                 * Minimum allowed viewport position.
                 */
                const minX =
                    originalViewBox.x -
                    overscrollX;

                const minY =
                    originalViewBox.y -
                    overscrollY;


                /*
                 * Maximum allowed viewport position.
                 */
                const maxX =
                    originalViewBox.x +
                    originalViewBox.width -
                    viewBox.width +
                    overscrollX;

                const maxY =
                    originalViewBox.y +
                    originalViewBox.height -
                    viewBox.height +
                    overscrollY;


                /*
                 * Clamp the viewport position.
                 */
                viewBox.x = Math.max(
                    minX,
                    Math.min(viewBox.x, maxX)
                );

                viewBox.y = Math.max(
                    minY,
                    Math.min(viewBox.y, maxY)
                );

            }


            // ============================================================
            // ZOOM AT MOUSE POSITION
            // ============================================================

            function zoomAt(
                clientX,
                clientY,
                factor
            ) {

                const rect =
                    svg.getBoundingClientRect();


                /*
                 * Mouse position as percentage of the
                 * visible SVG.
                 */
                const mouseX =
                    (clientX - rect.left) /
                    rect.width;

                const mouseY =
                    (clientY - rect.top) /
                    rect.height;


                /*
                 * Position under the mouse in SVG coordinates.
                 */
                const pointX =
                    viewBox.x +
                    mouseX * viewBox.width;

                const pointY =
                    viewBox.y +
                    mouseY * viewBox.height;


                /*
                 * Calculate new viewport size.
                 */
                let newWidth =
                    viewBox.width / factor;

                let newHeight =
                    viewBox.height / factor;


                /*
                 * Calculate zoom limits.
                 */
                const minimumWidth =
                    originalViewBox.width /
                    maxZoom;

                const maximumWidth =
                    originalViewBox.width /
                    minZoom;


                // --------------------------------------------------------
                // MAXIMUM ZOOM IN
                // --------------------------------------------------------

                if (newWidth < minimumWidth) {

                    const ratio =
                        minimumWidth /
                        newWidth;

                    newWidth =
                        minimumWidth;

                    newHeight *= ratio;

                }


                // --------------------------------------------------------
                // MAXIMUM ZOOM OUT
                // --------------------------------------------------------

                if (newWidth > maximumWidth) {

                    /*
                     * Return exactly to the fitted view.
                     */
                    resetView();
                    return;

                }


                /*
                 * Keep the point beneath the mouse cursor
                 * stationary while zooming.
                 */
                viewBox.x =
                    pointX -
                    mouseX * newWidth;

                viewBox.y =
                    pointY -
                    mouseY * newHeight;

                viewBox.width =
                    newWidth;

                viewBox.height =
                    newHeight;


                constrainPan();
                applyViewBox();

            }


            // ============================================================
            // MOUSE WHEEL ZOOM
            // ============================================================

            svg.addEventListener(
                "wheel",
                (event) => {

                    /*
                     * Prevent the page itself from scrolling
                     * while the mouse is over the topology.
                     */
                    event.preventDefault();


                    /*
                     * Scroll up   = zoom in
                     * Scroll down = zoom out
                     */
                    const factor =
                        event.deltaY < 0
                            ? 1.15
                            : 1 / 1.15;


                    zoomAt(
                        event.clientX,
                        event.clientY,
                        factor
                    );

                },
                {
                    passive: false
                }
            );


            // ============================================================
            // DRAG TO PAN
            // ============================================================

            let dragging = false;

            let previousX = 0;
            let previousY = 0;


            svg.addEventListener(
                "pointerdown",
                (event) => {

                    /*
                     * Only react to the left mouse button.
                     */
                    if (event.button !== 0) {
                        return;
                    }


                    /*
                     * Do not begin panning if the user
                     * clicked a D2 node containing a link.
                     *
                     * This preserves clickable devices.
                     */
                    if (event.target.closest("a")) {
                        return;
                    }


                    dragging = true;


                    previousX =
                        event.clientX;

                    previousY =
                        event.clientY;


                    svg.classList.add(
                        "topology-dragging"
                    );


                    /*
                     * Prevent browser-native SVG dragging
                     * and selection.
                     */
                    event.preventDefault();

                }
            );


            // ============================================================
            // POINTER MOVE
            // ============================================================

            /*
             * Listen on window instead of the SVG itself.
             *
             * This lets the mouse move outside the diagram
             * while dragging without losing control.
             */
            window.addEventListener(
                "pointermove",
                (event) => {

                    if (!dragging) {
                        return;
                    }


                    /*
                     * Failsafe:
                     *
                     * If the browser somehow missed pointerup
                     * but the left mouse button is physically
                     * no longer pressed, stop dragging.
                     */
                    if ((event.buttons & 1) === 0) {

                        stopDragging();
                        return;

                    }


                    const rect =
                        svg.getBoundingClientRect();


                    /*
                     * Mouse movement in screen pixels.
                     */
                    const deltaX =
                        event.clientX -
                        previousX;

                    const deltaY =
                        event.clientY -
                        previousY;


                    /*
                     * Convert screen movement into SVG
                     * viewBox coordinates.
                     */
                    viewBox.x -=
                        deltaX *
                        (
                            viewBox.width /
                            rect.width
                        );

                    viewBox.y -=
                        deltaY *
                        (
                            viewBox.height /
                            rect.height
                        );


                    previousX =
                        event.clientX;

                    previousY =
                        event.clientY;


                    /*
                     * Apply our soft boundaries.
                     */
                    constrainPan();

                    applyViewBox();

                }
            );


            // ============================================================
            // STOP DRAGGING
            // ============================================================

            function stopDragging() {

                if (!dragging) {
                    return;
                }


                dragging = false;


                svg.classList.remove(
                    "topology-dragging"
                );

            }


            /*
             * Releasing anywhere in the browser window
             * stops dragging.
             */
            window.addEventListener(
                "pointerup",
                stopDragging
            );


            window.addEventListener(
                "pointercancel",
                stopDragging
            );


            /*
             * Also stop if the browser/window loses focus.
             */
            window.addEventListener(
                "blur",
                stopDragging
            );


            // ============================================================
            // DOUBLE CLICK = RESET VIEW
            // ============================================================

            svg.addEventListener(
                "dblclick",
                (event) => {

                    /*
                     * Don't interfere with clickable nodes.
                     */
                    if (event.target.closest("a")) {
                        return;
                    }


                    event.preventDefault();


                    resetView();

                }
            );


            // ============================================================
            // INITIAL VIEW
            // ============================================================

            resetView();

        });

}


// ============================================================
// MATERIAL FOR MKDOCS INITIALIZATION
// ============================================================

if (typeof document$ !== "undefined") {

    /*
     * Material Instant Navigation support.
     */
    document$.subscribe(
        function () {

            initializeTopologyZoom();

        }
    );

}
else {

    /*
     * Normal MkDocs/browser fallback.
     */
    document.addEventListener(
        "DOMContentLoaded",
        initializeTopologyZoom
    );

}