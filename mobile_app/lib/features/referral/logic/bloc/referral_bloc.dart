import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/referral/data/referral_api_provider.dart';
import 'package:Hoga/features/jars/data/api_providers/payout_minimum_api_provider.dart';

part 'referral_event.dart';
part 'referral_state.dart';

class ReferralBloc extends Bloc<ReferralEvent, ReferralState> {
  final ReferralApiProvider _referralApiProvider;
  final PayoutMinimumApiProvider _payoutMinimumApiProvider;

  ReferralBloc({
    required ReferralApiProvider referralApiProvider,
    required PayoutMinimumApiProvider payoutMinimumApiProvider,
  })  : _referralApiProvider = referralApiProvider,
        _payoutMinimumApiProvider = payoutMinimumApiProvider,
        super(ReferralInitial()) {
    on<ReferralLoadRequested>(_onLoad);
    on<ReferralReloadRequested>(_onLoad);
  }

  Future<void> _onLoad(
    ReferralEvent event,
    Emitter<ReferralState> emit,
  ) async {
    if (event is ReferralLoadRequested) emit(ReferralLoading());

    try {
      final results = await Future.wait([
        _referralApiProvider.fetchMyBonuses(),
        _payoutMinimumApiProvider.getMinimumPayoutAmount(),
      ]);

      final bonuses = results[0] as Map<String, dynamic>;
      final minimum = results[1] as double;

      final summary = bonuses['summary'] as Map<String, dynamic>? ?? {};
      final balance = (summary['balance'] as num?)?.toDouble() ?? 0.0;
      final totalEarned = (summary['totalEarned'] as num?)?.toDouble() ?? 0.0;

      emit(ReferralLoaded(
        balance: balance,
        totalEarned: totalEarned,
        minimumPayoutAmount: minimum,
      ));
    } catch (e) {
      emit(ReferralError(message: e.toString()));
    }
  }
}
