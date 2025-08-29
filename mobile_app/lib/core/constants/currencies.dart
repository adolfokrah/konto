// Currency data model
class Currency {
  final String name;
  final String code;
  final String symbol;
  final String
  androidFallbackSymbol; // Fallback for Android if symbol doesn't render
  final String flagUrl;

  const Currency({
    required this.name,
    required this.code,
    required this.symbol,
    this.androidFallbackSymbol = '',
    required this.flagUrl,
  });
}

class Currencies {
  // Available currencies - Nigeria, Ghana, USD, Euro, and GBP
  static const List<Currency> all = [
    // Currency(
    //   name: 'Nigerian Naira',
    //   code: 'NGN',
    //   symbol: '₦',
    //   flagUrl: 'https://flagpedia.net/data/flags/w580/ng.png',
    // ),
    Currency(
      name: 'Ghanaian Cedi',
      code: 'GHC',
      symbol: '₵',
      androidFallbackSymbol: 'GHS',
      flagUrl: 'https://flagpedia.net/data/flags/w580/gh.png',
    ),
    // Currency(
    //   name: 'US Dollar',
    //   code: 'USD',
    //   symbol: '\$',
    //   flagUrl: 'https://flagpedia.net/data/flags/w580/us.png',
    // ),
    // Currency(
    //   name: 'Euro',
    //   code: 'EUR',
    //   symbol: '€',
    //   flagUrl: 'https://flagpedia.net/data/org/w580/eu.png',
    // ),
    // Currency(
    //   name: 'British Pound',
    //   code: 'GBP',
    //   symbol: '£',
    //   flagUrl: 'https://flagpedia.net/data/flags/w580/gb.png',
    // ),
  ];

  // Default currency (Ghanaian Cedi)
  static const Currency defaultCurrency = Currency(
    name: 'Ghanaian Cedi',
    code: 'GHS',
    symbol: '₵',
    androidFallbackSymbol: 'GHS',
    flagUrl: 'https://flagpedia.net/data/flags/w580/gh.png',
  );
}
