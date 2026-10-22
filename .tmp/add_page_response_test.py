from pathlib import Path
p = Path('apps/mindmark-server/src/test/java/com/mindmark/server/common/api/PageResponseTest.java')
p.parent.mkdir(parents=True, exist_ok=True)
text = '''package com.mindmark.server.common.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

class PageResponseTest {

    @Test
    void fromListClampsPageAndExposesNavigationMetadata() {
        PageResponse<Integer> response = PageResponse.fromList(List.of(1, 2, 3, 4, 5), 99, 2);

        assertThat(response.items()).containsExactly(5);
        assertThat(response.total()).isEqualTo(5);
        assertThat(response.page()).isEqualTo(3);
        assertThat(response.pageSize()).isEqualTo(2);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.hasPrevious()).isTrue();
        assertThat(response.hasNext()).isFalse();
    }

    @Test
    void fromPageKeepsDatabasePageMetadata() {
        PageImpl<String> page = new PageImpl<>(List.of("A", "B"), PageRequest.of(1, 2), 5);

        PageResponse<String> response = PageResponse.fromPage(page);

        assertThat(response.items()).containsExactly("A", "B");
        assertThat(response.total()).isEqualTo(5);
        assertThat(response.page()).isEqualTo(2);
        assertThat(response.pageSize()).isEqualTo(2);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.hasPrevious()).isTrue();
        assertThat(response.hasNext()).isTrue();
    }

    @Test
    void emptyAlwaysReturnsStableFirstPage() {
        PageResponse<Object> response = PageResponse.empty(9, 200);

        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(100);
        assertThat(response.totalPages()).isEqualTo(1);
        assertThat(response.hasPrevious()).isFalse();
        assertThat(response.hasNext()).isFalse();
    }
}
'''
p.write_text(text, encoding='utf-8')
