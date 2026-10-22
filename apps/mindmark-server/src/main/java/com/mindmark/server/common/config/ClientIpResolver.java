package com.mindmark.server.common.config;

import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Resolves the client address for security controls without trusting spoofed
 * forwarding headers from an untrusted network peer.
 */
@Component
public class ClientIpResolver {

    private final List<Cidr> trustedProxyCidrs;

    public ClientIpResolver(@Value("${mindmark.security.trusted-proxy-cidrs:}") String trustedProxyCidrs) {
        this.trustedProxyCidrs = parseCidrs(trustedProxyCidrs);
    }

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String remoteAddress = normalizeAddress(request.getRemoteAddr());
        if (remoteAddress == null) {
            remoteAddress = "unknown";
        }
        if (!isTrustedProxy(remoteAddress)) {
            return remoteAddress;
        }

        List<String> forwardedAddresses = parseForwardedAddresses(request);
        for (int index = forwardedAddresses.size() - 1; index >= 0; index -= 1) {
            String candidate = normalizeAddress(forwardedAddresses.get(index));
            if (candidate != null && !isTrustedProxy(candidate)) {
                return candidate;
            }
        }
        return remoteAddress;
    }

    private List<String> parseForwardedAddresses(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return Arrays.stream(xForwardedFor.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
        }

        String forwarded = request.getHeader("Forwarded");
        if (forwarded == null || forwarded.isBlank()) {
            return List.of();
        }
        List<String> addresses = new ArrayList<>();
        for (String element : forwarded.split(",")) {
            for (String parameter : element.split(";")) {
                String normalized = parameter.trim();
                if (normalized.regionMatches(true, 0, "for=", 0, 4)) {
                    addresses.add(normalized.substring(4).trim());
                    break;
                }
            }
        }
        return addresses;
    }

    private boolean isTrustedProxy(String address) {
        if (address == null) {
            return false;
        }
        return trustedProxyCidrs.stream().anyMatch(cidr -> cidr.contains(address));
    }

    private List<Cidr> parseCidrs(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<Cidr> result = new ArrayList<>();
        for (String token : value.split(",")) {
            String normalized = token.trim();
            if (normalized.isBlank()) {
                continue;
            }
            try {
                result.add(Cidr.parse(normalized));
            } catch (IllegalArgumentException ignored) {
                throw new IllegalStateException("Invalid trusted proxy CIDR: " + normalized);
            }
        }
        return List.copyOf(result);
    }

    private String normalizeAddress(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().replace("\"", "");
        if (normalized.startsWith("[") && normalized.contains("]")) {
            normalized = normalized.substring(1, normalized.indexOf(']'));
        }
        try {
            return InetAddress.getByName(normalized).getHostAddress();
        } catch (Exception ignored) {
            return null;
        }
    }

    private record Cidr(byte[] network, int prefixLength) {

        private static Cidr parse(String value) {
            String[] parts = value.split("/", 2);
            InetAddress address;
            try {
                address = InetAddress.getByName(parts[0].trim());
            } catch (Exception exception) {
                throw new IllegalArgumentException("Invalid network address", exception);
            }
            int bits = address.getAddress().length * 8;
            int prefix = parts.length == 1 ? bits : Integer.parseInt(parts[1].trim());
            if (prefix < 0 || prefix > bits) {
                throw new IllegalArgumentException("Invalid CIDR prefix");
            }
            return new Cidr(mask(address.getAddress(), prefix), prefix);
        }

        private boolean contains(String addressValue) {
            try {
                byte[] address = InetAddress.getByName(addressValue).getAddress();
                if (address.length != network.length) {
                    return false;
                }
                return matches(address, network, prefixLength);
            } catch (Exception ignored) {
                return false;
            }
        }

        private static byte[] mask(byte[] address, int prefix) {
            byte[] network = address.clone();
            int fullBytes = prefix / 8;
            int remainingBits = prefix % 8;
            if (fullBytes < network.length) {
                if (remainingBits > 0) {
                    network[fullBytes] &= (byte) (0xff << (8 - remainingBits));
                    fullBytes += 1;
                }
                Arrays.fill(network, fullBytes, network.length, (byte) 0);
            }
            return network;
        }

        private static boolean matches(byte[] address, byte[] network, int prefix) {
            int fullBytes = prefix / 8;
            for (int index = 0; index < fullBytes; index += 1) {
                if (address[index] != network[index]) {
                    return false;
                }
            }
            int remainingBits = prefix % 8;
            if (remainingBits == 0) {
                return true;
            }
            int mask = 0xff << (8 - remainingBits);
            return (address[fullBytes] & mask) == (network[fullBytes] & mask);
        }
    }
}
