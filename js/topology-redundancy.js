function initializeTopologyRedundancy() {

    document
        .querySelectorAll(".network-topology-viewer .d2")
        .forEach((container, containerIndex) => {


            // ============================================================
            // CLEAN UP PREVIOUS REDUNDANCY OVERLAY
            // ============================================================

            container
                .querySelectorAll(
                    ".topology-redundancy, .topology-redundancy-defs"
                )
                .forEach((element) => {
                    element.remove();
                });


            // ============================================================
            // HELPER:
            // CHECK WHETHER AN SVG CONTAINS A DEVICE LINK
            // ============================================================

            function containsDevice(svg, text) {

                return Array
                    .from(
                        svg.querySelectorAll("a")
                    )
                    .some((element) => {

                        const href =
                            element.getAttribute("href") ||
                            element.getAttribute("xlink:href") ||
                            "";

                        return href.includes(text);

                    });

            }


            // ============================================================
            // FIND SVGs CONTAINING BOTH L3 SWITCHES
            // ============================================================

            const candidates = Array
                .from(
                    container.querySelectorAll("svg")
                )
                .filter((svg) => {

                    const hasDK1 =
                        containsDevice(
                            svg,
                            "dk1-sw-l3"
                        );

                    const hasDK2 =
                        containsDevice(
                            svg,
                            "dk2-sw-l3"
                        );

                    return hasDK1 && hasDK2;

                });


            if (candidates.length === 0) {

                console.warn(
                    "Topology redundancy: no SVG containing both L3 switches was found."
                );

                return;

            }


            // ============================================================
            // HELPER:
            // DETERMINE SVG NESTING DEPTH
            // ============================================================

            function svgDepth(svg) {

                let depth = 0;

                let parent =
                    svg.ownerSVGElement;


                while (parent) {

                    depth++;

                    parent =
                        parent.ownerSVGElement;

                }

                return depth;

            }


            // ============================================================
            // PREFER THE SVG USED BY TOPOLOGY-ZOOM.JS
            // ============================================================

            let zoomCandidates =
                candidates.filter(
                    (svg) =>
                        svg.dataset.topologyZoomInitialized === "true"
                );


            if (zoomCandidates.length === 0) {

                zoomCandidates =
                    candidates;

            }


            // ============================================================
            // CHOOSE THE DEEPEST MATCHING SVG
            //
            // This is important.
            //
            // The outer SVG produced the old "static duplicate" line.
            // The deeper SVG is the one that correctly follows
            // topology zooming and panning.
            // ============================================================

            zoomCandidates.sort(
                (a, b) =>
                    svgDepth(b) -
                    svgDepth(a)
            );


            const svg =
                zoomCandidates[0];


            // ============================================================
            // FIND THE ACTUAL DEVICE NODES
            // ============================================================

            function findLinkedNode(text) {

                return Array
                    .from(
                        svg.querySelectorAll("a")
                    )
                    .find((element) => {

                        const href =
                            element.getAttribute("href") ||
                            element.getAttribute("xlink:href") ||
                            "";

                        return href.includes(text);

                    });

            }


            const dk1L3 =
                findLinkedNode(
                    "dk1-sw-l3"
                );

            const dk2L3 =
                findLinkedNode(
                    "dk2-sw-l3"
                );


            if (!dk1L3 || !dk2L3) {

                console.warn(
                    "Topology redundancy: could not locate both L3 switch nodes."
                );

                return;

            }


            // ============================================================
            // GET DEVICE POSITIONS
            // ============================================================

            const dk1Box =
                dk1L3.getBBox();

            const dk2Box =
                dk2L3.getBBox();


            /*
             * Start at the bottom-center of DK1 L3.
             */
            const startX =
                dk1Box.x +
                dk1Box.width / 2;

            const startY =
                dk1Box.y +
                dk1Box.height;


            /*
             * End at the top-center of DK2 L3.
             */
            const endX =
                dk2Box.x +
                dk2Box.width / 2;

            const endY =
                dk2Box.y;


            /*
             * Main connection geometry.
             */
            const pathData =
                `M ${startX} ${startY} L ${endX} ${endY}`;


            // ============================================================
            // SVG NAMESPACE
            // ============================================================

            const ns =
                "http://www.w3.org/2000/svg";


            // ============================================================
            // UNIQUE ARROW MARKER
            //
            // Unique IDs avoid conflicts if another topology is ever
            // placed on the same page.
            // ============================================================

            const markerId =
                `topology-redundancy-arrow-${containerIndex}`;


            const defs =
                document.createElementNS(
                    ns,
                    "defs"
                );


            defs.classList.add(
                "topology-redundancy-defs"
            );


            const marker =
                document.createElementNS(
                    ns,
                    "marker"
                );


            marker.setAttribute(
                "id",
                markerId
            );

            marker.setAttribute(
                "viewBox",
                "0 0 10 10"
            );

            marker.setAttribute(
                "refX",
                "8"
            );

            marker.setAttribute(
                "refY",
                "5"
            );

            marker.setAttribute(
                "markerWidth",
                "7"
            );

            marker.setAttribute(
                "markerHeight",
                "7"
            );

            marker.setAttribute(
                "orient",
                "auto-start-reverse"
            );

            marker.setAttribute(
                "markerUnits",
                "userSpaceOnUse"
            );


            const arrow =
                document.createElementNS(
                    ns,
                    "path"
                );


            arrow.setAttribute(
                "d",
                "M 0 0 L 10 5 L 0 10 Z"
            );


            arrow.classList.add(
                "topology-redundancy-arrow"
            );


            marker.appendChild(
                arrow
            );

            defs.appendChild(
                marker
            );

            svg.prepend(
                defs
            );


            // ============================================================
            // MAIN REDUNDANCY GROUP
            // ============================================================

            const group =
                document.createElementNS(
                    ns,
                    "g"
                );


            group.classList.add(
                "topology-redundancy"
            );


            /*
             * Do not interfere with:
             *
             * - topology dragging
             * - device links
             * - tooltips
             */
            group.setAttribute(
                "pointer-events",
                "none"
            );


            // ============================================================
            // BASE CONNECTION
            //
            // This is the permanent dashed redundancy link.
            // Arrowheads are placed at BOTH ends.
            // ============================================================

            const basePath =
                document.createElementNS(
                    ns,
                    "path"
                );


            basePath.setAttribute(
                "d",
                pathData
            );


            basePath.setAttribute(
                "marker-start",
                `url(#${markerId})`
            );


            basePath.setAttribute(
                "marker-end",
                `url(#${markerId})`
            );


            basePath.classList.add(
                "topology-redundancy-base"
            );


            group.appendChild(
                basePath
            );


            // ============================================================
            // FORWARD TRAFFIC FLOW
            //
            // DK1 -> DK2
            //
            // Slightly offset to one side of the base connection.
            // ============================================================

            const forwardPath =
                document.createElementNS(
                    ns,
                    "path"
                );


            forwardPath.setAttribute(
                "d",
                pathData
            );


            forwardPath.setAttribute(
                "transform",
                "translate(-15 0)"
            );


            forwardPath.classList.add(
                "topology-redundancy-flow",
                "topology-redundancy-forward"
            );


            group.appendChild(
                forwardPath
            );


            // ============================================================
            // REVERSE TRAFFIC FLOW
            //
            // DK2 -> DK1
            //
            // Offset to the opposite side so both traffic directions
            // are clearly visible.
            // ============================================================

            const reversePath =
                document.createElementNS(
                    ns,
                    "path"
                );


            reversePath.setAttribute(
                "d",
                pathData
            );


            reversePath.setAttribute(
                "transform",
                "translate(15 0)"
            );


            reversePath.classList.add(
                "topology-redundancy-flow",
                "topology-redundancy-reverse"
            );


            group.appendChild(
                reversePath
            );


            // ============================================================
            // CONNECTION LABEL
            // ============================================================

            const label =
                document.createElementNS(
                    ns,
                    "text"
                );


            label.textContent =
                "Redundancy";


            const middleX =
                (startX + endX) / 2;

            const middleY =
                (startY + endY) / 2;


            /*
             * Position the text slightly left of the connection.
             */
            label.setAttribute(
                "x",
                middleX - 14
            );


            label.setAttribute(
                "y",
                middleY
            );


            label.classList.add(
                "topology-redundancy-label"
            );


            group.appendChild(
                label
            );


            // ============================================================
            // ADD EVERYTHING TO THE CORRECT SVG
            // ============================================================

            svg.appendChild(
                group
            );


            console.debug(
                "Topology redundancy initialized.",
                {
                    svg: svg,
                    depth: svgDepth(svg),
                    candidates: candidates.length
                }
            );

        });

}


// ============================================================
// INITIALIZATION
// ============================================================

function scheduleTopologyRedundancy() {

    /*
     * topology-zoom.js should initialize first.
     *
     * Two animation frames give D2 + Material time to finish
     * inserting and preparing the SVG.
     */
    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            initializeTopologyRedundancy();

        });

    });

}


// ============================================================
// MATERIAL FOR MKDOCS
// ============================================================

if (typeof document$ !== "undefined") {

    document$.subscribe(
        function () {

            scheduleTopologyRedundancy();

        }
    );

}
else {

    document.addEventListener(
        "DOMContentLoaded",
        scheduleTopologyRedundancy
    );

}