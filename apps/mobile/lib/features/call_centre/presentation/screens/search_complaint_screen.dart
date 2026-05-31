import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../complaint/application/complaint_list_notifier.dart';
import '../../widgets/complaint_list_tile.dart';
import '../../../../../shared/widgets/app_scaffold.dart';
import '../../../../../shared/widgets/empty_state_view.dart';

class SearchComplaintScreen extends ConsumerStatefulWidget {
  const SearchComplaintScreen({super.key});

  @override
  ConsumerState<SearchComplaintScreen> createState() =>
      _SearchComplaintScreenState();
}

class _SearchComplaintScreenState extends ConsumerState<SearchComplaintScreen> {
  final _ctrl = TextEditingController();
  bool _hasSearched = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onChanged(String q) {
    setState(() => _hasSearched = q.isNotEmpty);
    if (q.isEmpty) return;
    ref.read(complaintListProvider.notifier).search(q);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(complaintListProvider);

    return AppScaffold(
      title: context.tr('nav.search'),
      showBack: true,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _ctrl,
              onChanged: _onChanged,
              decoration: InputDecoration(
                hintText: context.tr('common.search'),
                prefixIcon: const Icon(Icons.search_outlined),
                suffixIcon: _ctrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _ctrl.clear();
                          setState(() => _hasSearched = false);
                        },
                      )
                    : null,
              ),
            ),
          ),
          Expanded(
            child: !_hasSearched
                ? EmptyStateView(
                    icon: Icons.manage_search_outlined,
                    title: 'Search for a complaint',
                    subtitle: 'Enter a complaint number, consumer name or mobile',
                  )
                : state.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : state.complaints.isEmpty
                        ? EmptyStateView(
                            title: context.tr('common.no_data'),
                          )
                        : ListView.builder(
                            itemCount: state.complaints.length,
                            itemBuilder: (context, i) => ComplaintListTile(
                              complaint: state.complaints[i],
                              onTap: () => context.push(
                                  '/cc/complaints/${state.complaints[i].id}'),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
