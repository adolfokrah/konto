part of 'contributions_list_bloc.dart';

@immutable
sealed class ContributionsListState {}

final class ContributionsListInitial extends ContributionsListState {}

final class ContributionsListLoading extends ContributionsListState {}

final class ContributionsListLoaded extends ContributionsListState {
  final List<ContributionModel> contributions;
  final int totalDocs;
  final int limit;
  final int totalPages;
  final int page;
  final int pagingCounter;
  final bool hasPrevPage;
  final bool hasNextPage;
  final int? prevPage;
  final int? nextPage;
  final String? contributorSearch; // current contributor name/phone search term

  ContributionsListLoaded(
    this.contributions, {
    required this.totalDocs,
    required this.limit,
    required this.totalPages,
    required this.page,
    required this.pagingCounter,
    required this.hasPrevPage,
    required this.hasNextPage,
    this.prevPage,
    this.nextPage,
    this.contributorSearch,
  });
}

final class ContributionsListError extends ContributionsListState {
  final String message;

  ContributionsListError(this.message);
}
