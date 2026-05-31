import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../../core/constants/app_colors.dart';
import '../../../../complaint/data/repositories/complaint_repository_impl.dart';
import '../../../../../shared/widgets/app_scaffold.dart';

class CreateComplaintScreen extends ConsumerStatefulWidget {
  const CreateComplaintScreen({super.key});

  @override
  ConsumerState<CreateComplaintScreen> createState() =>
      _CreateComplaintScreenState();
}

class _CreateComplaintScreenState
    extends ConsumerState<CreateComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _natureCtrl = TextEditingController();
  final _remarksCtrl = TextEditingController();
  final _numberCtrl = TextEditingController();

  bool _isSubmitting = false;
  String? _error;
  String _numberStatus = 'idle'; // idle | checking | available | taken

  String? _userSubDivisionId;

  @override
  void initState() {
    super.initState();
    _loadSubDivision();
  }

  Future<void> _loadSubDivision() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final profile = await Supabase.instance.client
        .from('users')
        .select('sub_division_id')
        .eq('id', user.id)
        .single();
    setState(
        () => _userSubDivisionId = profile['sub_division_id'] as String?);
  }

  Future<void> _checkNumberAvailability(String raw) async {
    if (raw.isEmpty || _userSubDivisionId == null) return;
    setState(() => _numberStatus = 'checking');
    final existing = await Supabase.instance.client
        .from('complaints')
        .select('id')
        .eq('sub_division_id', _userSubDivisionId!)
        .ilike('raw_complaint_number', raw)
        .maybeSingle();
    setState(() => _numberStatus = existing != null ? 'taken' : 'available');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_numberStatus == 'taken') {
      setState(() => _error = 'Complaint number already exists');
      return;
    }
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      final repo = ref.read(complaintRepositoryProvider);
      final complaint = await repo.createComplaint(
        subDivisionId: _userSubDivisionId!,
        rawComplaintNumber: _numberCtrl.text.trim().toUpperCase(),
        consumerName: _nameCtrl.text.trim(),
        consumerMobile: _mobileCtrl.text.trim(),
        natureOfComplaint: _natureCtrl.text.trim(),
        complaintRemarks: _remarksCtrl.text.trim().isEmpty
            ? null
            : _remarksCtrl.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '${context.tr("complaint.create.success")}: ${complaint.displayNumber}'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _mobileCtrl.dispose();
    _natureCtrl.dispose();
    _remarksCtrl.dispose();
    _numberCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: context.tr('complaint.create.title'),
      showBack: true,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _label('Consumer Name *'),
                  TextFormField(
                    controller: _nameCtrl,
                    textCapitalization: TextCapitalization.words,
                    validator: (v) =>
                        (v == null || v.trim().length < 2) ? 'Required' : null,
                  ),
                  const SizedBox(height: 14),
                  _label('Consumer Mobile *'),
                  TextFormField(
                    controller: _mobileCtrl,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    validator: (v) =>
                        (v == null || !RegExp(r'^[6-9][0-9]{9}$').hasMatch(v))
                            ? 'Enter valid 10-digit Indian mobile'
                            : null,
                  ),
                  const SizedBox(height: 14),
                  _label('Nature of Complaint *'),
                  TextFormField(
                    controller: _natureCtrl,
                    maxLines: 3,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 14),
                  _label('Remarks (optional)'),
                  TextFormField(
                    controller: _remarksCtrl,
                    maxLines: 2,
                  ),
                  const SizedBox(height: 14),
                  _label('Complaint Reference Number *'),
                  TextFormField(
                    controller: _numberCtrl,
                    textCapitalization: TextCapitalization.characters,
                    onChanged: (v) {
                      if (v.length > 3) _checkNumberAvailability(v);
                    },
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Required' : null,
                    decoration: InputDecoration(
                      hintText: context.tr('complaint.create.number_hint'),
                      suffixIcon: _numberStatus == 'available'
                          ? const Icon(Icons.check_circle,
                              color: AppColors.success)
                          : _numberStatus == 'taken'
                              ? const Icon(Icons.cancel, color: AppColors.error)
                              : _numberStatus == 'checking'
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: Padding(
                                        padding: EdgeInsets.all(12),
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2),
                                      ))
                                  : null,
                    ),
                  ),
                  if (_numberStatus == 'taken')
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('Already taken in this Sub Division',
                          style:
                              TextStyle(color: AppColors.error, fontSize: 12)),
                    )
                  else if (_numberStatus == 'available')
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('Available',
                          style: TextStyle(
                              color: AppColors.success, fontSize: 12)),
                    ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!,
                        style: const TextStyle(color: AppColors.error)),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : Text(context.tr('complaint.actions.create')),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text,
          style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
    );
  }
}
