import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/jars/data/api_providers/payout_minimum_api_provider.dart';

part 'payout_minimum_event.dart';
part 'payout_minimum_state.dart';

class PayoutMinimumBloc extends Bloc<PayoutMinimumEvent, PayoutMinimumState> {
  final PayoutMinimumApiProvider _payoutMinimumApiProvider;

  PayoutMinimumBloc({required PayoutMinimumApiProvider payoutMinimumApiProvider})
      : _payoutMinimumApiProvider = payoutMinimumApiProvider,
        super(PayoutMinimumInitial()) {
    on<PayoutMinimumLoadRequested>(_onLoad);
  }

  Future<void> _onLoad(
    PayoutMinimumLoadRequested event,
    Emitter<PayoutMinimumState> emit,
  ) async {
    try {
      final minimum = await _payoutMinimumApiProvider.getMinimumPayoutAmount();
      emit(PayoutMinimumLoaded(minimumPayoutAmount: minimum));
    } catch (_) {}
  }
}
