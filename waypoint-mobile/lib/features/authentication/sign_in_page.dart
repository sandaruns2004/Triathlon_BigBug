import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../core/widgets/waypoint_widgets.dart';

class ConnectedSignInPage extends ConsumerStatefulWidget {
  const ConnectedSignInPage({super.key});
  @override
  ConsumerState<ConnectedSignInPage> createState() =>
      _ConnectedSignInPageState();
}

class _ConnectedSignInPageState extends ConsumerState<ConnectedSignInPage> {
  final email = TextEditingController(), password = TextEditingController();
  final form = GlobalKey<FormState>();
  bool busy = false, visible = false;
  String? message;
  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> signIn() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      message = null;
    });
    try {
      final principal = await ref
          .read(authProvider)!
          .signIn(email.text, password.text);
      if (mounted) {
        password.clear();
        ref.read(sessionProvider.notifier).state = principal;
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => message =
              'Sign-in could not be verified. Check the connection and credentials, or contact operations.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: AutofillGroup(
              child: Form(
                key: form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 32),
                    Text(
                      'Welcome to Waypoint Flow',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Sign in with your provisioned Driver or Store Manager account.',
                    ),
                    const SizedBox(height: 24),
                    if (ref.read(configProvider).authEmulatorHost.isNotEmpty)
                      const StatusChip('Isolated emulator environment'),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: email,
                      enabled: !busy,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.username],
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: (value) => value != null && value.contains('@')
                          ? null
                          : 'Enter your email.',
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: password,
                      enabled: !busy,
                      obscureText: !visible,
                      autofillHints: const [AutofillHints.password],
                      onFieldSubmitted: (_) => busy ? null : signIn(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        suffixIcon: IconButton(
                          tooltip: visible ? 'Hide password' : 'Show password',
                          onPressed: () => setState(() => visible = !visible),
                          icon: Icon(
                            visible
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) => value == null || value.isEmpty
                          ? 'Enter your password.'
                          : null,
                    ),
                    const SizedBox(height: 24),
                    PrimaryButton(
                      label: 'Sign in',
                      busy: busy,
                      onPressed: signIn,
                    ),
                    if (message != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Semantics(
                          liveRegion: true,
                          child: Text(message!),
                        ),
                      ),
                    const SizedBox(height: 20),
                    const Text(
                      'Activation or password recovery: contact operations. Saved proof stays protected when access expires.',
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
