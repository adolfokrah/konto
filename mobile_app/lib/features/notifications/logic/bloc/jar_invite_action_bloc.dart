import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';
import 'package:Hoga/features/notifications/data/repositories/notifications_repository.dart';

part 'jar_invite_action_event.dart';
part 'jar_invite_action_state.dart';

class JarInviteActionBloc
    extends Bloc<JarInviteActionEvent, JarInviteActionState> {
  final NotificationsRepository notificationsRepository;

  JarInviteActionBloc({required NotificationsRepository notificationsRepository})
    : notificationsRepository = notificationsRepository,
      super(JarInviteActionInitial()) {
    on<AcceptDeclineJarInvite>(_acceptDeclineJarInvite);
  }

  Future<void> _acceptDeclineJarInvite(
    AcceptDeclineJarInvite event,
    Emitter<JarInviteActionState> emit,
  ) async {
    emit(JarInviteActionLoading());
    try {
      final isAccept = event.action.toLowerCase() == 'accept';
      final result = await notificationsRepository.acceptDeclineInvite(
        jarId: event.jarId,
        accept: isAccept,
      );

      if (result['success'] == true) {
        emit(JarInviteActionSuccess());
      } else {
        emit(
          JarInviteActionError(
            message: result['message'] ?? 'Failed to process invite',
          ),
        );
      }
    } catch (e) {
      emit(JarInviteActionError(message: 'Unexpected error: ${e.toString()}'));
    }
  }
}
