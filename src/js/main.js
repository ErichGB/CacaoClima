(function ($) {
    "use strict";

    const randomScalingFactor = () => {
        let seed = 0;
        const l = (min, max) => {
            min = min === undefined ? 0 : min;
            max = max === undefined ? 1 : max;
            seed = (seed * 9301 + 49297) % 233280;
            return min + (seed / 233280) * (max - min);
        }

        return Math.round(l(-100, 100));
    };

    $(document).ready(() => {
        const project = {
            initialized: false,
            resizeHandlers: [],

            init: function() {
                if (!this.initialized) {
                    this.initialized = true;
                    this.tabs();
                    this.collapse();
                    this.dropdown();
                    this.chart();
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

            dropdown: () => {
                $('.dropdown-toggle').dropdown()
            },

            chart: () => {
                const chartPrecipitacion = document.getElementById('chartPrecipitacion').getContext('2d');
                const chartTemp = document.getElementById('chartTemp').getContext('2d');
                const chartAptitud = document.getElementById('chartAptitud').getContext('2d');
                const chartGradient = document.getElementById('chartGradient').getContext('2d');

                const gradient = (colorStart, colorEnd) => {
                    const gradient = chartPrecipitacion.createLinearGradient(0, 0, 0, 70);

                    gradient.addColorStop(0, colorStart);
                    gradient.addColorStop(1, colorEnd);

                    return gradient;
                };

                const config = (data, colorStart, colorEnd) => ({
                    type: 'line',
                    data: {
                        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                        datasets: [{
                            data,
                            backgroundColor: gradient(colorStart, colorEnd),
                            borderColor: colorStart,
                            // fill: 'start',
                            borderWidth: 2,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        elements: {
                            line: {
                                tension: 0.4
                            },
                            point: {
                                radius: 0
                            }
                        },
                        legend: {
                            display: false
                        },
                        tooltips: {
                            mode: 'index',
                            intersect: false,
                        },
                        title: {
                            display: true,
                            fontSize: 14,
                            text: '2019',
                            position: 'left',
                        },
                        hover: {
                            mode: 'nearest',
                            intersect: true
                        },
                        scales: {
                            xAxes: [{ display: false }],
                            yAxes: [{
                                display: false,
                                // ticks: {
                                //     suggestedMin: 50,
                                //     suggestedMax: 100
                                // }
                            }]
                        }
                    }
                });

                window.chartPrecipitacion = new Chart(chartPrecipitacion, config([500, 550, 600, 800, 1000, 1150, 900, 850, 600, 750, 950, 1200], 'rgba(40, 133, 221, 1)', 'rgba(40, 133, 221, 0)'));
                window.chartTemp = new Chart(chartTemp, config([500, 550, 600, 800, 1000, 1150, 900, 850, 600, 750, 950, 1200], 'rgba(243, 43, 43, 1)', 'rgba(243, 43, 43, 0)'));
                window.chartAptitud = new Chart(chartAptitud, config([500, 550, 600, 800, 1000, 1150, 900, 850, 600, 750, 950, 1200], 'rgba(133, 203, 244, 1)', 'rgba(133, 203, 244, 0)'));
                window.chartGradient = new Chart(chartGradient, config([500, 550, 600, 800, 1000, 1150, 900, 850, 600, 750, 950, 1200], 'rgba(117, 75, 32, 1)', 'rgba(117, 75, 32, 0)'));
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