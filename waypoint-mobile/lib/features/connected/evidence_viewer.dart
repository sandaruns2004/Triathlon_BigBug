import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/providers.dart';
import '../../core/data/operational_repository.dart';
import '../../core/widgets/waypoint_widgets.dart';

class EvidenceViewer extends ConsumerStatefulWidget {
  const EvidenceViewer({super.key, required this.evidenceId});
  final String evidenceId;
  @override
  ConsumerState<EvidenceViewer> createState() => _EvidenceViewerState();
}

class _EvidenceViewerState extends ConsumerState<EvidenceViewer> {
  Uint8List? bytes;
  String? error;
  @override
  void initState() {
    super.initState();
    Future.microtask(load);
  }

  Future<void> load() async {
    try {
      final owner = ref.read(sessionProvider)!;
      final response = await ref
          .read(apiProvider)
          .dio
          .get<List<int>>(
            'media/${widget.evidenceId}/view',
            options: Options(
              responseType: ResponseType.bytes,
              extra: {'expectedUserId': owner.userId},
            ),
          );
      var content = response.data!;
      if (response.headers
              .value('content-type')
              ?.contains('application/json') ==
          true) {
        final data = jsonDecode(utf8.decode(content)) as Map;
        final url = Uri.parse(data['viewUrl'] as String);
        if (url.scheme != 'https' || !url.hasAuthority) {
          throw StateError('Evidence access is unavailable.');
        }
        // The temporary object URL receives no application bearer credential.
        final media = await Dio().get<List<int>>(
          url.toString(),
          options: Options(responseType: ResponseType.bytes),
        );
        content = media.data!;
      }
      final current = ref.read(sessionProvider);
      if (current?.userId != owner.userId ||
          current?.role != owner.role ||
          current?.outletId != owner.outletId ||
          current?.depot != owner.depot) {
        return;
      }
      if (content.length > 2097152) {
        throw StateError('Evidence exceeds the supported image size.');
      }
      if (mounted) setState(() => bytes = Uint8List.fromList(content));
    } catch (e) {
      if (mounted) setState(() => error = apiMessage(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (error != null) {
      return ErrorState(
        message: error!,
        onRetry: () {
          setState(() => error = null);
          load();
        },
      );
    }
    if (bytes == null) return const Center(child: CircularProgressIndicator());
    return Image.memory(
      bytes!,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => const Text(
        'The image cannot be displayed. The delivery note is still available.',
      ),
    );
  }
}
