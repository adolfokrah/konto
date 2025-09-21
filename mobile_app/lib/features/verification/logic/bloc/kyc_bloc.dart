import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

part 'kyc_event.dart';
part 'kyc_state.dart';

class KycBloc extends Bloc<KycEvent, KycState> {
  KycBloc() : super(KycInitial()) {
    on<SetDocument>(_setDocument);
    on<ClearDocumentSide>(_clearDocumentSide);
  }

  void _setDocument(SetDocument event, Emitter<KycState> emit) {
    final currentState = state is KycDocument ? state as KycDocument : null;

    emit(
      KycDocument(
        documentType: event.documentType ?? currentState?.documentType,
        frontFilePath: event.frontFilePath ?? currentState?.frontFilePath,
        backFilePath: event.backFilePath ?? currentState?.backFilePath,
        photoFilePath: event.photoFilePath ?? currentState?.photoFilePath,
      ),
    );
  }

  void _clearDocumentSide(ClearDocumentSide event, Emitter<KycState> emit) {
    final currentState = state is KycDocument ? state as KycDocument : null;

    emit(
      KycDocument(
        documentType: currentState?.documentType,
        frontFilePath:
            event.side == 'front' ? null : currentState?.frontFilePath,
        backFilePath: event.side == 'back' ? null : currentState?.backFilePath,
        photoFilePath: currentState?.photoFilePath,
      ),
    );
  }
}
