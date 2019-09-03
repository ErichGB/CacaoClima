let project = {};

(function ($) {
    "use strict";

    $(document).ready(function () {
        project = {

            initialized: false,
            resizeHandlers: [],

            init: function () {
                const $tis = this;

                if (!$tis.initialized) {
                    $tis.initialized = true;
                    $tis.build();
                    $tis.events();
                }
            },

            build: function () {
                const $tis = this;
            },

            events: function () {
                const $tis = this;
                $tis.windowResize();
            },

            windowResize: function(){

            },
        };

        project.init();

    });
}(jQuery));