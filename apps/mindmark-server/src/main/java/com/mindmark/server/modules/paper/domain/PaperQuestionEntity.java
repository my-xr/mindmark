package com.mindmark.server.modules.paper.domain;

import com.mindmark.server.modules.question.domain.QuestionEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "paper_question")
public class PaperQuestionEntity {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "paper_id", nullable = false)
    private PaperEntity paper;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionEntity question;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal score;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PaperEntity getPaper() {
        return paper;
    }

    public void setPaper(PaperEntity paper) {
        this.paper = paper;
    }

    public QuestionEntity getQuestion() {
        return question;
    }

    public void setQuestion(QuestionEntity question) {
        this.question = question;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }
}