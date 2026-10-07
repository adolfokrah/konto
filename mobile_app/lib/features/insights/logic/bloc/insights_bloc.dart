import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:Hoga/features/insights/data/models/jar_insights_model.dart';
import 'package:Hoga/features/insights/data/repositories/insights_repository.dart';

// ---------------------------------------------------------------- events

sealed class InsightsEvent {
  const InsightsEvent();
}

/// Load insights for [jarId] over [period] (keeps the current period if null).
final class InsightsRequested extends InsightsEvent {
  final String jarId;
  final InsightsPeriod? period;
  const InsightsRequested({required this.jarId, this.period});
}

final class InsightsPeriodChanged extends InsightsEvent {
  final InsightsPeriod period;
  const InsightsPeriodChanged(this.period);
}

final class InsightsRefreshed extends InsightsEvent {
  const InsightsRefreshed();
}

// ---------------------------------------------------------------- state

enum InsightsStatus { initial, loading, loaded, forbidden, error }

class InsightsState {
  final InsightsStatus status;
  final String? jarId;
  final InsightsPeriod period;
  final JarInsights? insights;
  final String? message;

  const InsightsState({
    this.status = InsightsStatus.initial,
    this.jarId,
    this.period = InsightsPeriod.month,
    this.insights,
    this.message,
  });

  InsightsState copyWith({
    InsightsStatus? status,
    String? jarId,
    InsightsPeriod? period,
    JarInsights? insights,
    bool clearInsights = false,
    String? message,
  }) => InsightsState(
    status: status ?? this.status,
    jarId: jarId ?? this.jarId,
    period: period ?? this.period,
    insights: clearInsights ? null : (insights ?? this.insights),
    message: message,
  );
}

// ---------------------------------------------------------------- bloc

class InsightsBloc extends Bloc<InsightsEvent, InsightsState> {
  final InsightsRepository _repository;

  InsightsBloc({required InsightsRepository insightsRepository})
    : _repository = insightsRepository,
      super(const InsightsState()) {
    on<InsightsRequested>(
      (e, emit) => _load(emit, e.jarId, e.period ?? state.period),
    );
    on<InsightsPeriodChanged>((e, emit) async {
      final jarId = state.jarId;
      if (jarId == null || e.period == state.period) return;
      await _load(emit, jarId, e.period);
    });
    on<InsightsRefreshed>((e, emit) async {
      final jarId = state.jarId;
      if (jarId == null) return;
      await _load(emit, jarId, state.period, keepContent: true);
    });
  }

  Future<void> _load(
    Emitter<InsightsState> emit,
    String jarId,
    InsightsPeriod period, {
    bool keepContent = false,
  }) async {
    final sameJar = jarId == state.jarId;
    emit(
      state.copyWith(
        status:
            keepContent && state.status == InsightsStatus.loaded
                ? InsightsStatus.loaded
                : InsightsStatus.loading,
        jarId: jarId,
        period: period,
        // Switching jars shouldn't flash the old jar's numbers.
        clearInsights: !sameJar,
      ),
    );
    final result = await _repository.getJarInsights(
      jarId: jarId,
      period: period,
    );
    // A newer request (other jar or period) has started meanwhile.
    if (state.jarId != jarId || state.period != period) return;
    switch (result) {
      case InsightsSuccess(:final insights):
        emit(state.copyWith(status: InsightsStatus.loaded, insights: insights));
      case InsightsForbidden():
        emit(
          state.copyWith(status: InsightsStatus.forbidden, clearInsights: true),
        );
      case InsightsFailure(:final message):
        emit(state.copyWith(status: InsightsStatus.error, message: message));
    }
  }
}
