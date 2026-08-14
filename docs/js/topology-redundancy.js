function initializeTopologyRedundancy() {

    document
        .querySelectorAll(".network-topology-viewer .d2")
        .forEach((container, containerIndex) => {


            // ============================================================
            // MASTER NETWORK FLOW SPEED
            //
            // Controlled from CSS:
            //
            // --network-flow-speed: 0.55;
            //
            // 1.00 = original D2 speed
            // 0.75 = 75% speed
            // 0.50 = half speed
            // ============================================================

            function getNetworkFlowSpeed() {

                const value =
                    getComputedStyle(
                        document.documentElement
                    )
                    .getPropertyValue(
                        "--network-flow-speed"
                    )
                    .trim();


                const parsed =
                    Number.parseFloat(value);


                if (
                    Number.isFinite(parsed) &&
                    parsed > 0
                ) {
                    return parsed;
                }


                return 0.55;
            }


            const networkFlowSpeed =
                getNetworkFlowSpeed();


            // ============================================================
            // CLEAN UP OLD REDUNDANCY OVERLAY
            // ============================================================

            container
                .querySelectorAll(
                    ".topology-redundancy, .topology-redundancy-defs"
                )
                .forEach((element) => {

                    /*
                     * Cancel any Web Animations first.
                     */
                    element
                        .querySelectorAll("*")
                        .forEach((child) => {

                            if (
                                typeof child.getAnimations ===
                                "function"
                            ) {

                                child
                                    .getAnimations()
                                    .forEach(
                                        (animation) => {
                                            animation.cancel();
                                        }
                                    );

                            }

                        });


                    element.remove();

                });


            // ============================================================
            // HELPER:
            // CHECK WHETHER AN SVG CONTAINS A DEVICE
            // ============================================================

            function containsDevice(
                svg,
                text
            ) {

                return Array
                    .from(
                        svg.querySelectorAll("a")
                    )
                    .some((element) => {

                        const href =
                            element.getAttribute(
                                "href"
                            ) ||
                            element.getAttribute(
                                "xlink:href"
                            ) ||
                            "";

                        return href.includes(
                            text
                        );

                    });

            }


            // ============================================================
            // FIND SVGs CONTAINING BOTH L3 SWITCHES
            // ============================================================

            const candidates =
                Array
                    .from(
                        container.querySelectorAll(
                            "svg"
                        )
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


                        return (
                            hasDK1 &&
                            hasDK2
                        );

                    });


            if (
                candidates.length === 0
            ) {

                console.warn(
                    "Topology redundancy: no SVG containing both L3 switches was found."
                );

                return;

            }


            // ============================================================
            // HELPER:
            // SVG NESTING DEPTH
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
            // PREFER THE SVG INITIALIZED BY TOPOLOGY-ZOOM.JS
            // ============================================================

            let zoomCandidates =
                candidates.filter(
                    (svg) =>
                        svg.dataset
                            .topologyZoomInitialized ===
                        "true"
                );


            if (
                zoomCandidates.length === 0
            ) {

                zoomCandidates =
                    candidates;

            }


            // ============================================================
            // USE THE DEEPEST MATCHING SVG
            //
            // We already discovered that the outer SVG gives us the
            // unwanted static overlay.
            // ============================================================

            zoomCandidates.sort(
                (a, b) =>
                    svgDepth(b) -
                    svgDepth(a)
            );


            const svg =
                zoomCandidates[0];


            // ============================================================
            // HELPER:
            // DETECT A DASH-OFFSET ANIMATION
            // ============================================================

            function isDashAnimation(
                animation
            ) {

                if (
                    !animation ||
                    !animation.effect ||
                    typeof animation.effect
                        .getKeyframes !==
                        "function"
                ) {
                    return false;
                }


                const keyframes =
                    animation.effect
                        .getKeyframes();


                return keyframes.some(
                    (frame) => {

                        return (
                            frame.strokeDashoffset !==
                                undefined ||
                            frame[
                                "stroke-dashoffset"
                            ] !==
                                undefined
                        );

                    }
                );

            }


            // ============================================================
            // FIND ALL NATIVE D2 FLOW ANIMATIONS
            //
            // IMPORTANT:
            // This runs BEFORE our redundancy paths are inserted.
            //
            // Therefore everything found here belongs to D2.
            // ============================================================

            const nativeAnimations = [];


            Array
                .from(
                    svg.querySelectorAll(
                        "path"
                    )
                )
                .forEach((path) => {

                    if (
                        typeof path.getAnimations !==
                        "function"
                    ) {
                        return;
                    }


                    path
                        .getAnimations()
                        .forEach(
                            (animation) => {

                                if (
                                    !isDashAnimation(
                                        animation
                                    )
                                ) {
                                    return;
                                }


                                nativeAnimations.push({
                                    path:
                                        path,

                                    animation:
                                        animation
                                });

                            }
                        );

                });


            // ============================================================
            // PICK ONE D2 CONNECTION AS THE REFERENCE
            //
            // We will copy:
            //
            // - its real keyframes
            // - its real dash pattern
            // - its real duration
            // - its real easing
            //
            // onto our custom redundancy connection.
            // ============================================================

            const reference =
                nativeAnimations.length > 0
                    ? nativeAnimations[0]
                    : null;


            // ============================================================
            // SLOW THE NATIVE D2 CONNECTIONS
            //
            // playbackRate:
            //
            // 1.0 = normal
            // 0.5 = half speed
            // 0.25 = quarter speed
            //
            // This DOES NOT affect the redundancy paths because
            // they haven't been created yet.
            // ============================================================

            nativeAnimations.forEach(
                ({
                    animation
                }) => {

                    try {

                        if (
                            typeof animation
                                .updatePlaybackRate ===
                            "function"
                        ) {

                            animation
                                .updatePlaybackRate(
                                    networkFlowSpeed
                                );

                        }
                        else {

                            animation.playbackRate =
                                networkFlowSpeed;

                        }

                    }
                    catch (error) {

                        console.warn(
                            "Topology redundancy: unable to change D2 playback rate.",
                            error
                        );

                    }

                }
            );


            // ============================================================
            // FIND DEVICE NODES
            // ============================================================

            function findLinkedNode(
                text
            ) {

                return Array
                    .from(
                        svg.querySelectorAll("a")
                    )
                    .find((element) => {

                        const href =
                            element.getAttribute(
                                "href"
                            ) ||
                            element.getAttribute(
                                "xlink:href"
                            ) ||
                            "";

                        return href.includes(
                            text
                        );

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


            if (
                !dk1L3 ||
                !dk2L3
            ) {

                console.warn(
                    "Topology redundancy: could not locate both L3 switches."
                );

                return;

            }


            // ============================================================
            // DEVICE POSITIONS
            // ============================================================

            const dk1Box =
                dk1L3.getBBox();


            const dk2Box =
                dk2L3.getBBox();


            // ------------------------------------------------------------
            // DK1:
            // Bottom-center of L3 switch
            // ------------------------------------------------------------

            const startX =
                dk1Box.x +
                dk1Box.width / 2;


            const startY =
                dk1Box.y +
                dk1Box.height;


            // ------------------------------------------------------------
            // DK2:
            // Top-center of L3 switch
            // ------------------------------------------------------------

            const endX =
                dk2Box.x +
                dk2Box.width / 2;

                /*
            * Stop the redundancy flow slightly above DK2
            * so the spacing visually matches DK1.
            */
            const bottomGap =
                10;

            const endY =
                dk2Box.y -
                bottomGap;


            // ------------------------------------------------------------
            // Main connection geometry
            // ------------------------------------------------------------

            const pathData =
                `M ${startX} ${startY} L ${endX} ${endY}`;


            // ============================================================
            // SVG NAMESPACE
            // ============================================================

            const ns =
                "http://www.w3.org/2000/svg";


            // ============================================================
            // ARROWHEAD DEFINITIONS
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


            group.setAttribute(
                "pointer-events",
                "none"
            );


            // ============================================================
            // BASE CONNECTION
            //
            // Static dashed redundancy path.
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
            // FORWARD FLOW
            //
            // DK1 -> DK2
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
            // REVERSE FLOW
            //
            // DK2 -> DK1
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
            // LABEL
            // ============================================================

            const label =
                document.createElementNS(
                    ns,
                    "text"
                );


            label.textContent =
                "Redundancy";


            const middleX =
                (
                    startX +
                    endX
                ) / 2;


            const middleY =
                (
                    startY +
                    endY
                ) / 2;


            label.setAttribute(
                "x",
                middleX - 30
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
            // ADD REDUNDANCY GROUP TO SVG
            // ============================================================

            svg.appendChild(
                group
            );


            // ============================================================
            // COPY D2'S REAL ANIMATION
            //
            // This is the "slick" part.
            // ============================================================

            if (reference) {

                const referenceAnimation =
                    reference.animation;


                const referencePath =
                    reference.path;


                const effect =
                    referenceAnimation.effect;


                const timing =
                    effect.getTiming();


                const d2Keyframes =
                    effect.getKeyframes();


                // --------------------------------------------------------
                // COPY ONLY THE STROKE-DASHOFFSET KEYFRAMES
                // --------------------------------------------------------

                const copiedKeyframes =
                    d2Keyframes.map(
                        (frame) => {

                            const copied = {};


                            if (
                                frame.offset !==
                                null &&
                                frame.offset !==
                                undefined
                            ) {

                                copied.offset =
                                    frame.offset;

                            }


                            if (
                                frame.easing
                            ) {

                                copied.easing =
                                    frame.easing;

                            }


                            const dashOffset =
                                frame
                                    .strokeDashoffset ??
                                frame[
                                    "stroke-dashoffset"
                                ];


                            if (
                                dashOffset !==
                                undefined
                            ) {

                                copied.strokeDashoffset =
                                    dashOffset;

                            }


                            return copied;

                        }
                    );


                // --------------------------------------------------------
                // COPY D2'S ACTUAL DASH APPEARANCE
                // --------------------------------------------------------

                const referenceStyle =
                    getComputedStyle(
                        referencePath
                    );


                const nativeDashArray =
                    referenceStyle
                        .strokeDasharray;


                const nativeLineCap =
                    referenceStyle
                        .strokeLinecap;


                if (
                    nativeDashArray &&
                    nativeDashArray !==
                    "none"
                ) {

                    forwardPath.style
                        .strokeDasharray =
                        nativeDashArray;


                    reversePath.style
                        .strokeDasharray =
                        nativeDashArray;

                }


                if (
                    nativeLineCap
                ) {

                    forwardPath.style
                        .strokeLinecap =
                        nativeLineCap;


                    reversePath.style
                        .strokeLinecap =
                        nativeLineCap;

                }


                // --------------------------------------------------------
                // COPY D2'S REAL DURATION
                // --------------------------------------------------------

                let duration =
                    Number(
                        timing.duration
                    );


                if (
                    !Number.isFinite(
                        duration
                    ) ||
                    duration <= 0
                ) {

                    duration =
                        1000;

                }


                // --------------------------------------------------------
                // COPY D2'S EASING
                // --------------------------------------------------------

                const easing =
                    timing.easing &&
                    timing.easing !==
                        "auto"
                        ? timing.easing
                        : "linear";


                // --------------------------------------------------------
                // CREATE FORWARD ANIMATION
                // --------------------------------------------------------

                const forwardAnimation =
                    forwardPath.animate(
                        copiedKeyframes,
                        {
                            duration:
                                duration,

                            iterations:
                                Infinity,

                            easing:
                                easing,

                            direction:
                                "normal"
                        }
                    );


                // --------------------------------------------------------
                // CREATE REVERSE ANIMATION
                //
                // Same D2 animation, opposite direction.
                // --------------------------------------------------------

                const reverseAnimation =
                    reversePath.animate(
                        copiedKeyframes,
                        {
                            duration:
                                duration,

                            iterations:
                                Infinity,

                            easing:
                                easing,

                            direction:
                                "reverse"
                        }
                    );


                // --------------------------------------------------------
                // APPLY EXACT SAME MASTER SPEED TO BOTH
                // --------------------------------------------------------

                if (
                    typeof forwardAnimation
                        .updatePlaybackRate ===
                    "function"
                ) {

                    forwardAnimation
                        .updatePlaybackRate(
                            networkFlowSpeed
                        );


                    reverseAnimation
                        .updatePlaybackRate(
                            networkFlowSpeed
                        );

                }
                else {

                    forwardAnimation
                        .playbackRate =
                        networkFlowSpeed;


                    reverseAnimation
                        .playbackRate =
                        networkFlowSpeed;

                }


                // --------------------------------------------------------
                // MATCH THE CURRENT D2 ANIMATION PHASE
                //
                // This isn't required for matching speed, but it means
                // the redundancy link begins in roughly the same phase.
                // --------------------------------------------------------

                if (
                    referenceAnimation
                        .currentTime !==
                    null
                ) {

                    try {

                        forwardAnimation
                            .currentTime =
                            referenceAnimation
                                .currentTime;


                        reverseAnimation
                            .currentTime =
                            referenceAnimation
                                .currentTime;

                    }
                    catch (error) {

                        /*
                         * Phase syncing is optional.
                         * Ignore browsers that reject it.
                         */

                    }

                }


                console.debug(
                    "Topology flow synchronization active.",
                    {
                        speed:
                            networkFlowSpeed,

                        nativeAnimations:
                            nativeAnimations.length,

                        nativeDuration:
                            duration,

                        dashArray:
                            nativeDashArray
                    }
                );

            }


            // ============================================================
            // FALLBACK
            //
            // Used only if no native D2 dash animation could be detected.
            // ============================================================

            else {

                console.warn(
                    "Topology redundancy: native D2 animation could not be detected. Using fallback animation."
                );


                forwardPath.style
                    .strokeDasharray =
                    "5 20";


                reversePath.style
                    .strokeDasharray =
                    "5 20";


                const fallbackForward =
                    forwardPath.animate(
                        [
                            {
                                strokeDashoffset:
                                    "0"
                            },
                            {
                                strokeDashoffset:
                                    "-25"
                            }
                        ],
                        {
                            duration:
                                1200,

                            iterations:
                                Infinity,

                            easing:
                                "linear"
                        }
                    );


                const fallbackReverse =
                    reversePath.animate(
                        [
                            {
                                strokeDashoffset:
                                    "0"
                            },
                            {
                                strokeDashoffset:
                                    "25"
                            }
                        ],
                        {
                            duration:
                                1200,

                            iterations:
                                Infinity,

                            easing:
                                "linear"
                        }
                    );


                fallbackForward
                    .playbackRate =
                    networkFlowSpeed;


                fallbackReverse
                    .playbackRate =
                    networkFlowSpeed;

            }

        });

}


// ============================================================
// INITIALIZATION
// ============================================================

function scheduleTopologyRedundancy() {

    /*
     * topology-zoom.js runs first.
     *
     * Give D2 / Material two frames to finish preparing the SVG
     * before inspecting its animations.
     */

    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    initializeTopologyRedundancy();

                }
            );

        }
    );

}


// ============================================================
// MATERIAL FOR MKDOCS
// ============================================================

if (
    typeof document$ !==
    "undefined"
) {

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