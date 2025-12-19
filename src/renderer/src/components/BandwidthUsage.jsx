import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Title,
} from 'chart.js';
import { selectDarkMode } from '../store/darkModeSlice';
import { useSelector } from 'react-redux';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Title);

const BandwidthUsage = () => {
    const chartRef = useRef(null);
    const darkMode = useSelector(selectDarkMode);

    // Data for the chart
    const data = {
        labels: ['02.00', '03.00', '04.00', '05.00', '06.00', '07.00', '08.00', '09.00', '10.00', '11.00', '12.00'],
        datasets: [
            {
                label: 'Earnings',
                data: [0.25, 2.5, 3.8, 0.6, 1.4, 0.6, 0.7, 4.2, 2.9, 3.1, 1.8],
                borderColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;

                    if (!chartArea) {
                        return null;
                    }

                    // Create a gradient with 3-4 colors
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, chartArea.right, chartArea.top);
                    gradient.addColorStop(0, '#FC5452'); // Red
                    gradient.addColorStop(0.44, '#DC6FB3'); // Yellow-Orange
                    gradient.addColorStop(0.86, darkMode ? '#fff':'#000'); // Purple
                    return gradient;
                },
                borderWidth: 5, // Increased thickness for bold line
                fill: false,
                pointRadius: 0, // No dots on points
                tension: 0.4, // Smooth curves
            },
        ],
    };

    // Chart options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#FFFFFF',
                titleColor: '#000000',
                bodyColor: '#000000',
                borderColor: '#FF5F6D',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: (tooltipItem) => `${tooltipItem.raw} fVPN`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false, // Remove horizontal grid lines for X-axis
                },
                ticks: {
                    color: '#6C6A6A',
                    font: {
                        size: 12,
                    },
                },
                title: {
                    display: true,
                    text: 'Hours', // Label for the horizontal axis
                    color: '#6C6A6A',
                    font: {
                        size: 14,
                    },
                },
            },
            y: {
                grid: {
                    drawBorder: false, // Remove leftmost border line
                    color: '#EDEDED', // Base color for grid lines
                    lineWidth: 1,
                    borderDash: [5, 5], // Dashed horizontal lines
                },
                ticks: {
                    stepSize: 1, // Show labels for 1GB, 2GB, 3GB, etc.
                    callback: (value) => `${value} GB`, // Append "GB" to tick values
                    color: '#6C6A6A',
                    font: {
                        size: 12,
                    },
                },
                min: 0, // Start from 0
                max: 5, // End at 5
                title: {
                    display: true,
                    text: 'Bandwidth', // Label for the vertical axis
                    color: '#6C6A6A',
                    font: {
                        size: 14,
                    },
                    padding: {
                        top: 10, // Adjust padding to reduce vertical gap
                    },
                },
            },
        },
        elements: {
            line: {
                borderJoinStyle: 'round',
            },
        },
    };


    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.update();
        }
    }, []);

    return (
        <div className="w-full h-[300px] pb-10">
            <h3 className="font-futosans-bold text-xl mb-4">Bandwidth Usage</h3>
            <Line ref={chartRef} data={data} options={options} />
        </div>
    );
};

export default BandwidthUsage;
