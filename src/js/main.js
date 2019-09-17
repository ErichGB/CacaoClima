(function ($) {
    "use strict";

    $(document).ready(() => {
        const project = {
            initialized: false,
            resizeHandlers: [],

            init: function() {
                if (!this.initialized) {
                    this.initialized = true;
                    this.tabs();
                    this.collapse();
                    this.events();
                }
            },

            tabs: () => {
                $('a[data-toggle="tab"]').on('click', () => {
                    $(this).tab('show')
                })
            },

            collapse: () => {
                $('.collapse').collapse()
            },

            events: function () {
                // $tis.windowResize();
            },

            windowResize: function(){

            },
        };

        project.init();

    });
}(jQuery));