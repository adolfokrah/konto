import 'package:dio/dio.dart';
import 'package:konto/core/services/local_storage_service.dart';
import 'package:konto/core/services/sms_otp_service.dart';
import 'package:konto/core/services/user_storage_service.dart';
import 'package:konto/features/authentication/data/api_providers/auth_api_provider.dart';
import 'package:konto/features/authentication/data/repositories/auth_repository.dart';
import 'package:konto/features/verification/data/api_providers/sms_api_provider.dart';
import 'package:konto/features/verification/data/repositories/verification_repository.dart';
import 'package:konto/features/onboarding/data/repositories/onboarding_repository.dart';

/// Service registry for dependency injection
/// Ensures all services are properly initialized with their dependencies
class ServiceRegistry {
  static final ServiceRegistry _instance = ServiceRegistry._internal();
  factory ServiceRegistry() => _instance;
  ServiceRegistry._internal();
  
  // Track initialization state
  bool _isInitialized = false;
  
  // Core services
  late final Dio _dio;
  late final LocalStorageService _localStorageService;
  late final SmsOtpService _smsOtpService;
  late final UserStorageService _userStorageService;
  
  // API providers
  late final SmsApiProvider _smsApiProvider;
  late final AuthApiProvider _authApiProvider;
  
  // Repositories
  late final AuthRepository _authRepository;
  late final VerificationRepository _verificationRepository;
  late final OnboardingRepository _onboardingRepository;
  
  /// Initialize all services with proper dependency injection
  void initialize() {
    // Skip if already initialized
    if (_isInitialized) {
      print('⚠️ ServiceRegistry already initialized, skipping...');
      return;
    }
    
    // Initialize Dio with configuration
    _dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Initialize core services
    _localStorageService = LocalStorageService();
    _smsOtpService = SmsOtpService();
    _userStorageService = UserStorageService(localStorageService: _localStorageService);
    
    // Initialize API providers with Dio
    _smsApiProvider = SmsApiProvider(dio: _dio);
    _authApiProvider = AuthApiProvider(
      dio: _dio,
    );
    
    // Initialize repositories with dependencies
    _authRepository = AuthRepository(
      smsOtpService: _smsOtpService,
      authApiProvider: _authApiProvider,
      userStorageService: _userStorageService,
    );
    
    _verificationRepository = VerificationRepository(
      smsOtpService: _smsOtpService,
      smsApiProvider: _smsApiProvider,
    );
    
    _onboardingRepository = OnboardingRepository(
      localStorageService: _localStorageService,
    );
    
    _isInitialized = true;
    print('✅ ServiceRegistry initialized with Dio successfully');
  }
  
  // Getters for accessing initialized services
  Dio get dio => _dio;
  LocalStorageService get localStorageService => _localStorageService;
  SmsOtpService get smsOtpService => _smsOtpService;
  UserStorageService get userStorageService => _userStorageService;
  SmsApiProvider get smsApiProvider => _smsApiProvider;
  AuthApiProvider get authApiProvider => _authApiProvider;
  AuthRepository get authRepository => _authRepository;
  VerificationRepository get verificationRepository => _verificationRepository;
  OnboardingRepository get onboardingRepository => _onboardingRepository;
  
  /// Reset the registry (useful for testing)
  void reset() {
    _isInitialized = false;
  }
  
  /// Initialize with custom Dio instance (useful for testing)
  void initializeWithDio(Dio customDio) {
    // Skip if already initialized
    if (_isInitialized) {
      reset();
    }
    
    // Use the provided Dio instance
    _dio = customDio;
    
    // Initialize core services
    _localStorageService = LocalStorageService();
    _smsOtpService = SmsOtpService();
    _userStorageService = UserStorageService(localStorageService: _localStorageService);
    
    // Initialize API providers with custom Dio
    _smsApiProvider = SmsApiProvider(dio: _dio);
    _authApiProvider = AuthApiProvider(
      dio: _dio,
    );
    
    // Initialize repositories with dependencies
    _authRepository = AuthRepository(
      smsOtpService: _smsOtpService,
      authApiProvider: _authApiProvider,
      userStorageService: _userStorageService,
    );
    
    _verificationRepository = VerificationRepository(
      smsOtpService: _smsOtpService,
      smsApiProvider: _smsApiProvider,
    );
    
    _onboardingRepository = OnboardingRepository(
      localStorageService: _localStorageService,
    );
    
    _isInitialized = true;
    print('✅ ServiceRegistry initialized with custom Dio for testing');
  }
}
