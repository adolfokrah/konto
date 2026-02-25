import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import 'package:Hoga/core/services/auth_interceptor.dart';
import 'package:Hoga/core/services/local_storage_service.dart';
import 'package:Hoga/core/services/translation_service.dart';
import 'package:Hoga/core/services/user_storage_service.dart';
import 'package:Hoga/core/services/jar_storage_service.dart';
import 'package:Hoga/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:Hoga/features/authentication/data/repositories/auth_repository.dart';
import 'package:Hoga/features/verification/data/api_providers/verification_provider.dart';
import 'package:Hoga/features/verification/data/repositories/verification_repository.dart';
import 'package:Hoga/features/onboarding/data/repositories/walkthrough_repository.dart';
import 'package:Hoga/features/jars/data/api_providers/jar_api_provider.dart';
import 'package:Hoga/features/jars/data/repositories/jar_repository.dart';
import 'package:Hoga/features/media/data/api_provider/media_api_provider.dart';
import 'package:Hoga/features/media/data/repository_provider/media_repository.dart';
import 'package:Hoga/features/contribution/data/api_reproviders/contribution_api_provider.dart';
import 'package:Hoga/features/contribution/data/repositories/contribution_repository.dart';
import 'package:Hoga/features/contribution/data/api_reproviders/momo_api_provider.dart';
import 'package:Hoga/features/contribution/data/repositories/momo_repository.dart';
import 'package:Hoga/features/user_account/data/api_providers/user_account_api_provider.dart';
import 'package:Hoga/features/user_account/data/repositories/user_account_repository.dart';
import 'package:Hoga/features/notifications/data/api_proivders/notifications_provider.dart';
import 'package:Hoga/features/notifications/data/repositories/notifications_repository.dart';
import 'package:Hoga/features/collaborators/data/api_providers/collaborators_providers.dart';
import 'package:Hoga/features/collaborators/data/repositories/collaborators_repository.dart';
import 'package:Hoga/features/onboarding/logic/bloc/onboarding_bloc.dart';
import 'package:Hoga/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/verification_bloc.dart';
import 'package:Hoga/features/verification/logic/bloc/kyc_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary/jar_summary_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_summary_reload/jar_summary_reload_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_list/jar_list_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/jar_create/jar_create_bloc.dart';
import 'package:Hoga/features/jars/logic/bloc/update_jar/update_jar_bloc.dart';
import 'package:Hoga/features/media/logic/bloc/media_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/add_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/fetch_contribution_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/momo_payment_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/filter_contributions_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/contributions_list_bloc.dart';
import 'package:Hoga/features/contribution/logic/bloc/export_contributions_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/user_account_bloc.dart';
import 'package:Hoga/features/user_account/logic/bloc/withdrawal_account_verification_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/notifications_bloc.dart';
import 'package:Hoga/features/notifications/logic/bloc/jar_invite_action_bloc.dart';
import 'package:Hoga/features/collaborators/logic/bloc/reminder_bloc.dart';
import 'package:Hoga/features/collaborators/logic/bloc/collectors_bloc.dart';

final getIt = GetIt.instance;

void setupServiceLocator() {
  // ── Core services ──
  getIt.registerLazySingleton<Dio>(
    () => Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      ),
    ),
  );
  getIt.registerLazySingleton<LocalStorageService>(() => LocalStorageService());
  getIt.registerLazySingleton<UserStorageService>(
    () => UserStorageService(localStorageService: getIt<LocalStorageService>()),
  );
  getIt.registerLazySingleton<JarStorageService>(
    () => JarStorageService(localStorageService: getIt<LocalStorageService>()),
  );
  getIt.registerLazySingleton<TranslationService>(() {
    final service = TranslationService();
    service.initialize();
    return service;
  });

  // ── API providers ──
  getIt.registerLazySingleton<AuthApiProvider>(
    () => AuthApiProvider(dio: getIt<Dio>()),
  );

  // ── Auth interceptor (handles 401 with automatic token refresh) ──
  getIt<Dio>().interceptors.add(
    AuthInterceptor(
      userStorageService: getIt<UserStorageService>(),
      authApiProvider: getIt<AuthApiProvider>(),
      dio: getIt<Dio>(),
    ),
  );

  getIt.registerLazySingleton<VerificationProvider>(
    () => VerificationProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<JarApiProvider>(
    () => JarApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<MediaApiProvider>(
    () => MediaApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<ContributionApiProvider>(
    () => ContributionApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<MomoApiProvider>(
    () => MomoApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<UserAccountApiProvider>(
    () => UserAccountApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<NotificationsApiProvider>(
    () => NotificationsApiProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<CollaboratorsProvider>(
    () => CollaboratorsProvider(
      dio: getIt<Dio>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );

  // ── Repositories ──
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepository(
      authApiProvider: getIt<AuthApiProvider>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<VerificationRepository>(
    () => VerificationRepository(
      verificationProvider: getIt<VerificationProvider>(),
    ),
  );
  getIt.registerLazySingleton<WalkthroughRepository>(
    () => WalkthroughRepository(
      localStorageService: getIt<LocalStorageService>(),
    ),
  );
  getIt.registerLazySingleton<JarRepository>(
    () => JarRepository(jarApiProvider: getIt<JarApiProvider>()),
  );
  getIt.registerLazySingleton<MediaRepository>(
    () => MediaRepository(mediaApiProvider: getIt<MediaApiProvider>()),
  );
  getIt.registerLazySingleton<ContributionRepository>(
    () => ContributionRepository(
      contributionApiProvider: getIt<ContributionApiProvider>(),
    ),
  );
  getIt.registerLazySingleton<MomoRepository>(
    () => MomoRepository(momoApiProvider: getIt<MomoApiProvider>()),
  );
  getIt.registerLazySingleton<UserAccountRepository>(
    () => UserAccountRepository(
      apiProvider: getIt<UserAccountApiProvider>(),
      userStorageService: getIt<UserStorageService>(),
    ),
  );
  getIt.registerLazySingleton<NotificationsRepository>(
    () => NotificationsRepository(
      apiProvider: getIt<NotificationsApiProvider>(),
    ),
  );
  getIt.registerLazySingleton<CollaboratorsRepository>(
    () => CollaboratorsRepository(
      collaboratorsProvider: getIt<CollaboratorsProvider>(),
    ),
  );

  // ── BLoCs: independent (lazy singletons) ──
  getIt.registerLazySingleton<OnboardingBloc>(
    () => OnboardingBloc(
      walkthroughRepository: getIt<WalkthroughRepository>(),
    ),
  );
  getIt.registerLazySingleton<AuthBloc>(
    () => AuthBloc(
      authRepository: getIt<AuthRepository>(),
      translationService: getIt<TranslationService>(),
    ),
  );
  getIt.registerLazySingleton<VerificationBloc>(
    () => VerificationBloc(
      verificationRepository: getIt<VerificationRepository>(),
      translationService: getIt<TranslationService>(),
    ),
  );
  getIt.registerLazySingleton<JarSummaryBloc>(
    () => JarSummaryBloc(
      jarRepository: getIt<JarRepository>(),
      jarStorageService: getIt<JarStorageService>(),
      translationService: getIt<TranslationService>(),
    ),
  );
  getIt.registerLazySingleton<JarListBloc>(
    () => JarListBloc(jarRepository: getIt<JarRepository>()),
  );
  getIt.registerLazySingleton<JarCreateBloc>(
    () => JarCreateBloc(jarRepository: getIt<JarRepository>()),
  );
  getIt.registerLazySingleton<MediaBloc>(
    () => MediaBloc(mediaRepository: getIt<MediaRepository>()),
  );
  getIt.registerLazySingleton<AddContributionBloc>(
    () => AddContributionBloc(
      contributionRepository: getIt<ContributionRepository>(),
    ),
  );
  getIt.registerLazySingleton<FetchContributionBloc>(
    () => FetchContributionBloc(
      contributionRepository: getIt<ContributionRepository>(),
    ),
  );
  getIt.registerLazySingleton<UpdateJarBloc>(
    () => UpdateJarBloc(jarRepository: getIt<JarRepository>()),
  );
  getIt.registerLazySingleton<FilterContributionsBloc>(
    () => FilterContributionsBloc(),
  );
  getIt.registerLazySingleton<ExportContributionsBloc>(
    () => ExportContributionsBloc(
      contributionRepository: getIt<ContributionRepository>(),
    ),
  );
  getIt.registerLazySingleton<KycBloc>(
    () => KycBloc(
      verificationRepository: getIt<VerificationRepository>(),
    ),
  );
  getIt.registerLazySingleton<NotificationsBloc>(
    () => NotificationsBloc(
      notificationsRepository: getIt<NotificationsRepository>(),
    ),
  );
  getIt.registerLazySingleton<ReminderBloc>(
    () => ReminderBloc(
      collaboratorsRepository: getIt<CollaboratorsRepository>(),
    ),
  );
  getIt.registerLazySingleton<WithdrawalAccountVerificationBloc>(
    () => WithdrawalAccountVerificationBloc(
      userAccountRepository: getIt<UserAccountRepository>(),
    ),
  );
  getIt.registerLazySingleton<MomoPaymentBloc>(
    () => MomoPaymentBloc(momoRepository: getIt<MomoRepository>()),
  );
  getIt.registerLazySingleton<JarInviteActionBloc>(
    () => JarInviteActionBloc(
      notificationsRepository: getIt<NotificationsRepository>(),
    ),
  );

  // ── BLoCs: dependent on other BLoCs (must register after deps) ──
  getIt.registerLazySingleton<JarSummaryReloadBloc>(
    () => JarSummaryReloadBloc(
      jarSummaryBloc: getIt<JarSummaryBloc>(),
      jarRepository: getIt<JarRepository>(),
      jarStorageService: getIt<JarStorageService>(),
      translationService: getIt<TranslationService>(),
    ),
  );
  getIt.registerLazySingleton<UserAccountBloc>(
    () => UserAccountBloc(
      authBloc: getIt<AuthBloc>(),
      userAccountRepository: getIt<UserAccountRepository>(),
    ),
  );
  getIt.registerLazySingleton<ContributionsListBloc>(
    () => ContributionsListBloc(
      contributionRepository: getIt<ContributionRepository>(),
      filterBloc: getIt<FilterContributionsBloc>(),
    ),
  );

  // ── BLoCs: factories (new instance per usage) ──
  getIt.registerFactory<CollectorsBloc>(
    () => CollectorsBloc(
      collaboratorsRepository: getIt<CollaboratorsRepository>(),
    ),
  );
}
