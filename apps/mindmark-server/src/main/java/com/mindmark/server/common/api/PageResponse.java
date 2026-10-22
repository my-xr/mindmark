package com.mindmark.server.common.api;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> items,
    long total,
    int page,
    int pageSize,
    int totalPages,
    boolean hasPrevious,
    boolean hasNext
) {
    public PageResponse(List<T> items, long total, int page, int pageSize) {
        this(
            items,
            total,
            page,
            pageSize,
            calculateTotalPages(total, pageSize),
            page > 1,
            page < calculateTotalPages(total, pageSize)
        );
    }

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    public static <T> PageResponse<T> fromList(List<T> source, Integer requestedPage, Integer requestedPageSize) {
        int safePageSize = normalizePageSize(requestedPageSize);
        int totalPages = calculateTotalPages(source.size(), safePageSize);
        int safePage = Math.min(normalizePage(requestedPage), totalPages);
        int fromIndex = Math.min((safePage - 1) * safePageSize, source.size());
        int toIndex = Math.min(fromIndex + safePageSize, source.size());

        return new PageResponse<>(
            source.subList(fromIndex, toIndex),
            source.size(),
            safePage,
            safePageSize,
            totalPages,
            safePage > 1,
            safePage < totalPages
        );
    }

    public static <T> PageResponse<T> fromPage(Page<T> page) {
        int totalPages = Math.max(1, page.getTotalPages());
        int responsePage = Math.min(page.getNumber() + 1, totalPages);
        return new PageResponse<>(
            page.getContent(),
            page.getTotalElements(),
            responsePage,
            page.getSize(),
            totalPages,
            responsePage > 1,
            responsePage < totalPages
        );
    }

    public static <T> PageResponse<T> empty(Integer requestedPage, Integer requestedPageSize) {
        int safePageSize = normalizePageSize(requestedPageSize);
        return new PageResponse<>(List.of(), 0, 1, safePageSize, 1, false, false);
    }

    public static int normalizePage(Integer requestedPage) {
        if (requestedPage == null || requestedPage <= 0) {
            return 1;
        }
        return requestedPage;
    }

    public static int normalizePageSize(Integer requestedPageSize) {
        if (requestedPageSize == null || requestedPageSize <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requestedPageSize, MAX_PAGE_SIZE);
    }

    private static int calculateTotalPages(long total, int pageSize) {
        return Math.max(1, (int) Math.ceil((double) total / Math.max(pageSize, 1)));
    }
}
