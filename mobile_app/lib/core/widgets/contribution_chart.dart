import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class ContributionChart extends StatelessWidget {
  /// The data points for the chart
  final List<double> dataPoints;

  /// The color of the chart line and gradient
  final Color chartColor;

  /// Whether to show the gradient fill under the line
  final bool showGradient;

  /// Height of the chart
  final double height;

  const ContributionChart({
    super.key,
    required this.dataPoints,
    this.chartColor = Colors.green,
    this.showGradient = true,
    this.height = 200,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: _generateSpots(),
              isCurved: true,
              color: chartColor,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: showGradient,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    chartColor.withOpacity(0.3),
                    chartColor.withOpacity(0.1),
                    chartColor.withOpacity(0.0),
                  ],
                ),
              ),
            ),
          ],
          minX: 0,
          maxX: (dataPoints.length - 1).toDouble(),
          minY: _getMinY(),
          maxY: _getMaxY(),
        ),
      ),
    );
  }

  List<FlSpot> _generateSpots() {
    return dataPoints.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value);
    }).toList();
  }

  double _getMinY() {
    if (dataPoints.isEmpty) return 0;
    final minValue = dataPoints.reduce((a, b) => a < b ? a : b);
    return minValue - (minValue * 0.1); // Add 10% padding below
  }

  double _getMaxY() {
    if (dataPoints.isEmpty) return 100;
    final maxValue = dataPoints.reduce((a, b) => a > b ? a : b);
    return maxValue + (maxValue * 0.1); // Add 10% padding above
  }
}

/// A more detailed chart with customizable features
class DetailedContributionChart extends StatelessWidget {
  /// The data points for the chart
  final List<ChartDataPoint> dataPoints;

  /// The color of the chart line and gradient
  final Color chartColor;

  /// Height of the chart
  final double height;

  /// Whether to show grid lines
  final bool showGrid;

  /// Whether to show data point dots
  final bool showDots;

  const DetailedContributionChart({
    super.key,
    required this.dataPoints,
    this.chartColor = Colors.green,
    this.height = 200,
    this.showGrid = false,
    this.showDots = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: showGrid,
            drawVerticalLine: false,
            horizontalInterval: _getGridInterval(),
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: Colors.grey.withOpacity(0.3),
                strokeWidth: 1,
              );
            },
          ),
          titlesData: FlTitlesData(
            show: showGrid,
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: showGrid,
                reservedSize: 40,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString(),
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  );
                },
              ),
            ),
            bottomTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: _generateSpots(),
              isCurved: true,
              color: chartColor,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: FlDotData(
                show: showDots,
                getDotPainter: (spot, percent, barData, index) {
                  return FlDotCirclePainter(
                    radius: 4,
                    color: chartColor,
                    strokeWidth: 2,
                    strokeColor: Colors.white,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    chartColor.withOpacity(0.3),
                    chartColor.withOpacity(0.1),
                    chartColor.withOpacity(0.0),
                  ],
                ),
              ),
            ),
          ],
          minX: 0,
          maxX: (dataPoints.length - 1).toDouble(),
          minY: _getMinY(),
          maxY: _getMaxY(),
        ),
      ),
    );
  }

  List<FlSpot> _generateSpots() {
    return dataPoints.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.value);
    }).toList();
  }

  double _getMinY() {
    if (dataPoints.isEmpty) return 0;
    final minValue = dataPoints
        .map((e) => e.value)
        .reduce((a, b) => a < b ? a : b);
    return minValue - (minValue * 0.1).abs();
  }

  double _getMaxY() {
    if (dataPoints.isEmpty) return 100;
    final maxValue = dataPoints
        .map((e) => e.value)
        .reduce((a, b) => a > b ? a : b);
    return maxValue + (maxValue * 0.1);
  }

  double _getGridInterval() {
    final range = _getMaxY() - _getMinY();
    return range / 5; // Show 5 grid lines
  }
}

/// Data model for chart points
class ChartDataPoint {
  final double value;
  final String? label;
  final DateTime? date;

  const ChartDataPoint({required this.value, this.label, this.date});
}
