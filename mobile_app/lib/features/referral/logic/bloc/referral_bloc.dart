import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/referral/data/referral_api_provider.dart';

part 'referral_event.dart';
part 'referral_state.dart';

class ReferralBloc extends Bloc<ReferralEvent, ReferralState> {
  final ReferralApiProvider _referralApiProvider;

  ReferralBloc({required ReferralApiProvider referralApiProvider})
      : _referralApiProvider = referralApiProvider,
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
      final bonuses = await _referralApiProvider.fetchMyBonuses();
      final summary = bonuses['summary'] as Map<String, dynamic>? ?? {};
      final balance = (summary['balance'] as num?)?.toDouble() ?? 0.0;
      final totalEarned = (summary['totalEarned'] as num?)?.toDouble() ?? 0.0;

      emit(ReferralLoaded(balance: balance, totalEarned: totalEarned));
    } catch (e) {
      emit(ReferralError(message: e.toString()));
    }
  }
}
