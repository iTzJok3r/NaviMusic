enum EndpointType {
  remote,
  local,
}

/// Represents a configured Navidrome server connection target.
class NavidromeEndpoint {
  final String id;
  final String name;
  final String baseUrl; // e.g. https://music.example.com or http://192.168.1.50:4533
  final EndpointType type;
  final String? pinSha256; // Required/checked for remote endpoints
  final bool verifyCert; // false for LAN self-signed certificates
  final int priority; // 0 = highest priority

  const NavidromeEndpoint({
    required this.id,
    required this.name,
    required this.baseUrl,
    required this.type,
    this.pinSha256,
    this.verifyCert = true,
    this.priority = 0,
  });

  Uri get uri => Uri.parse(baseUrl);

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'baseUrl': baseUrl,
        'type': type.name,
        'pinSha256': pinSha256,
        'verifyCert': verifyCert,
        'priority': priority,
      };

  factory NavidromeEndpoint.fromJson(Map<String, dynamic> json) => NavidromeEndpoint(
        id: json['id'] as String,
        name: json['name'] as String,
        baseUrl: json['baseUrl'] as String,
        type: EndpointType.values.byName(json['type'] as String),
        pinSha256: json['pinSha256'] as String?,
        verifyCert: json['verifyCert'] as bool? ?? true,
        priority: json['priority'] as int? ?? 0,
      );
}
