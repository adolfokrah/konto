import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:konto/features/authentication/logic/bloc/auth_bloc.dart';
import 'package:konto/features/jars/logic/bloc/jar_summary_bloc.dart';

class JarDetailView extends StatefulWidget {
  const JarDetailView({super.key});

  @override
  State<JarDetailView> createState() => _JarDetailViewState();
}

class _JarDetailViewState extends State<JarDetailView> {
  @override
  void initState() {
    super.initState();
    // Trigger jar summary request when page loads for the first time
    context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        // Handle sign out - navigate to login
        if (state is AuthInitial) {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/login', (route) => false);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Jar Details'),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            IconButton(
              onPressed: () {
                context.read<JarSummaryBloc>().add(GetJarSummaryRequested());
              },
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
            ),
          ],
        ),
        body: BlocBuilder<JarSummaryBloc, JarSummaryState>(
          builder: (context, state) {
            if (state is JarSummaryLoading) {
              return const Center(child: CircularProgressIndicator());
            } else if (state is JarSummaryError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red[300],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        state.message,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.red[600]),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          context.read<JarSummaryBloc>().add(
                            GetJarSummaryRequested(),
                          );
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              );
            } else if (state is JarSummaryLoaded) {
              // Display jar details
              final jarData = state.jarData;
              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      jarData.name,
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    if (jarData.description != null)
                      Text(
                        jarData.description!,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    const SizedBox(height: 16),
                    Text('Goal: GH₵ ${jarData.goalAmount.toStringAsFixed(2)}'),
                    Text(
                      'Current Balance: GH₵ ${jarData.acceptedContributionAmount.toStringAsFixed(2)}',
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value:
                          jarData.acceptedContributionAmount /
                          jarData.goalAmount,
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Progress: ${((jarData.acceptedContributionAmount / jarData.goalAmount) * 100).toStringAsFixed(1)}%',
                    ),
                    // Add more details as needed
                  ],
                ),
              );
            }
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Create a new jar to see details here.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
