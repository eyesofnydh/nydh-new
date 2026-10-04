let chart;

    document.addEventListener("DOMContentLoaded", function () {
      if (!window.Highcharts) {
        const fallback = document.getElementById('highchart-pie');
        fallback.classList.add('chart-fallback');
        fallback.setAttribute('role', 'img');
        fallback.setAttribute('aria-label', 'Quality Analyst 35%, Coder 30%, Photography 15%, Designer 20%');
        return;
      }
      chart = Highcharts.chart('highchart-pie', {
        chart: {
          type: 'pie',
          backgroundColor: 'transparent',
          events: {
            render() {
              const chart = this;
              const cx = chart.plotLeft + chart.plotWidth / 2 - 35;
              const cy = chart.plotTop + chart.plotHeight / 2 - 35;

              if (!chart.customImage) {
                chart.customImage = chart.renderer
                  .image('./images/optimized/nidhiHead.webp', cx, cy, 70, 70)
                  .add();
              } else {
                chart.customImage.attr({ x: cx, y: cy });
              }
            }
          }
        },
        title: { text: null },
        tooltip: {
          useHTML: true,
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderColor: 'transparent',
          borderRadius: 8,
          style: {
            color: '#fff',
            fontFamily: 'Poppins, sans-serif',
          },
          formatter: function () {
            return `<b>${this.key}</b>`;
          }
        },
        plotOptions: {
          pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 2,
            dataLabels: {
              enabled: true,
              format: '{point.percentage:.1f}%',
              color: '#fff',
              distance: -30,
              style: {
                fontFamily: 'Poppins, sans-serif',
                fontSize: '13px',
                textOutline: 'none'
              }
            }
          }
        },
        series: [{
          name: 'Skill',
          innerSize: '60%',
          data: [
            { name: 'Quality Analyst', y: 35, color: '#00e5e5' },
            { name: 'Coder', y: 30, color: '#4a7eff' },
            { name: 'Photography', y: 15, color: '#a36bf4' },
            { name: 'Designer', y: 20, color: '#f5c07a' }
          ]
        }],
        credits: { enabled: false }
      });

      // Hover button => highlight chart slice
      document.querySelectorAll('.skill-btn').forEach((btn, index) => {
        btn.addEventListener('mouseenter', () => {
          if (chart.series[0].points[index]) {
            chart.series[0].points[index].setState('hover');
          }
        });
        btn.addEventListener('mouseleave', () => {
          chart.series[0].points[index].setState('');
        });
      });
    });
