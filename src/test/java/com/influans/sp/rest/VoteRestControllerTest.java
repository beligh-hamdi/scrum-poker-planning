package com.influans.sp.rest;

import com.google.common.collect.ImmutableList;
import com.influans.sp.AppIntegrationTest;
import com.influans.sp.builders.*;
import com.influans.sp.dto.DefaultResponse;
import com.influans.sp.dto.ErrorResponse;
import com.influans.sp.dto.VoteDto;
import com.influans.sp.entity.SessionEntity;
import com.influans.sp.entity.StoryEntity;
import com.influans.sp.entity.UserEntity;
import com.influans.sp.entity.VoteEntity;
import com.influans.sp.enums.ResponseStatus;
import com.influans.sp.repository.SessionRepository;
import com.influans.sp.repository.StoryRepository;
import com.influans.sp.repository.UserRepository;
import com.influans.sp.repository.VoteRepository;
import org.assertj.core.api.Assertions;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.ws.rs.core.Response;
import java.util.List;

import static com.influans.sp.dto.ErrorResponse.Attributes.EXCEPTION;
import static com.influans.sp.dto.ErrorResponse.Attributes.URI;
import static com.influans.sp.exception.CustomErrorCode.OBJECT_NOT_FOUND;

/**
 * @author hazem
 */
public class VoteRestControllerTest extends AppIntegrationTest {

    @Autowired
    private VoteRepository voteRepository;
    @Autowired
    private StoryRepository storyRepository;
    @Autowired
    private SessionRepository sessionRepository;
    @Autowired
    private UserRepository userRepository;

    /**
     * @verifies return 200 status
     * @see VoteRestController#listVote(String)
     */
    @Test
    @SuppressWarnings("unchecked")
    public void listVote_shouldReturn200Status() throws Exception {
        // given
        final String storyId = "storyId";
        final StoryEntity storyEntity = StoryEntityBuilder.builder()
                .withStoryId(storyId)
                .build();
        storyRepository.save(storyEntity);

        final List<VoteEntity> votes = ImmutableList.<VoteEntity>builder()
                .add(VoteEntityBuilder.builder()
                        .withStoryId(storyId)
                        .withVoteId("vote1")
                        .build())
                .add(VoteEntityBuilder.builder()
                        .withStoryId(storyId)
                        .withVoteId("vote2")
                        .build())
                .build();
        voteRepository.save(votes);

        // when
        final List<VoteDto> response = givenJsonClient()
                .queryParam("storyId", storyId)
                .get("/votes")
                .then()
                .statusCode(Response.Status.OK.getStatusCode())
                .extract()
                .as(List.class);

        // then
        Assertions.assertThat(response).hasSize(2);
    }

    /**
     * @verifies return valid error status if an exception has been thrown
     * @see VoteRestController#listVote(String)
     */
    @Test
    public void listVote_shouldReturnValidErrorStatusIfAnExceptionHasBeenThrown() throws Exception {
        // when
        final ErrorResponse errorResponse = givenJsonClient()
                .queryParam("storyId", "invalid_story_id")
                .get("/votes")
                .then()
                .statusCode(OBJECT_NOT_FOUND.getStatusCode())
                .extract()
                .as(ErrorResponse.class);

        // then
        Assertions.assertThat(errorResponse.get(EXCEPTION)).isNotNull();
        Assertions.assertThat(errorResponse.get(URI)).isEqualTo("/votes");
    }

    /**
     * @verifies return 200 status
     * @see VoteRestController#delete(String)
     */
    @Test
    public void delete_shouldReturn200Status() throws Exception {
        // given
        final String storyId = "storyId";
        final StoryEntity storyEntity = StoryEntityBuilder.builder()
                .withStoryId(storyId)
                .build();
        storyRepository.save(storyEntity);

        final String voteId = "voteId";
        final VoteEntity voteEntity = VoteEntityBuilder.builder()
                .withStoryId(storyId)
                .withVoteId(voteId)
                .build();
        voteRepository.save(voteEntity);

        // when
        final DefaultResponse response = givenJsonClient()
                .delete("/votes/{voteId}", voteId)
                .then()
                .statusCode(Response.Status.OK.getStatusCode())
                .extract()
                .as(DefaultResponse.class);

        // then
        Assertions.assertThat(response).isNotNull();
        Assertions.assertThat(response.getStatus()).isEqualTo(ResponseStatus.OK);
    }

    /**
     * @verifies return valid error status if an exception has been thrown
     * @see VoteRestController#delete(String)
     */
    @Test
    public void delete_shouldReturnValidErrorStatusIfAnExceptionHasBeenThrown() throws Exception {
        // when
        final ErrorResponse errorResponse = givenJsonClient()
                .delete("/votes/{voteId}", "invalid_vote_id")
                .then()
                .statusCode(OBJECT_NOT_FOUND.getStatusCode())
                .extract()
                .as(ErrorResponse.class);

        // then
        Assertions.assertThat(errorResponse.get(EXCEPTION)).isNotNull();
        Assertions.assertThat(errorResponse.get(URI)).isEqualTo("/votes/invalid_vote_id");
    }

    /**
     * @verifies return 200 status
     * @see VoteRestController#saveVote(com.influans.sp.dto.VoteDto)
     */
    @Test
    public void saveVote_shouldReturn200Status() throws Exception {
        // given
        final String sessionId = "sessionId";
        final SessionEntity sessionEntity = SessionEntityBuilder.builder()
                .withSessionId(sessionId)
                .build();
        sessionRepository.save(sessionEntity);

        final String storyId = "storyId";
        final StoryEntity storyEntity = StoryEntityBuilder.builder()
                .withSessionId(sessionId)
                .withStoryId(storyId)
                .build();
        storyRepository.save(storyEntity);

        final String username = "username";
        final UserEntity userEntity = UserEntityBuilder.builder()
                .withUsername(username)
                .withSessionId(sessionId)
                .build();
        userRepository.save(userEntity);

        final VoteDto voteDto = VoteDtoBuilder.builder()
                .withSessionId(sessionId)
                .withStoryId(storyId)
                .withUsername(username)
                .withValue("value")
                .build();

        // when
        final VoteDto response = givenJsonClient()
                .body(voteDto)
                .post("/votes")
                .then()
                .statusCode(Response.Status.OK.getStatusCode())
                .extract()
                .as(VoteDto.class);

        // then
        Assertions.assertThat(response).isNotNull();
        Assertions.assertThat(response.getVoteId()).isNotNull();

    }

    /**
     * @verifies return valid error status if an exception has been thrown
     * @see VoteRestController#saveVote(com.influans.sp.dto.VoteDto)
     */
    @Test
    public void saveVote_shouldReturnValidErrorStatusIfAnExceptionHasBeenThrown() throws Exception {
        // given
        final VoteDto voteDto = VoteDtoBuilder.builder()
                .withSessionId("invalid_session_id")
                .withStoryId("storyId")
                .withUsername("username")
                .withValue("value")
                .build();

        // when
        final ErrorResponse errorResponse = givenJsonClient()
                .body(voteDto)
                .post("/votes")
                .then()
                .statusCode(OBJECT_NOT_FOUND.getStatusCode())
                .extract()
                .as(ErrorResponse.class);

        // then
        Assertions.assertThat(errorResponse.get(EXCEPTION)).isNotNull();
        Assertions.assertThat(errorResponse.get(URI)).isEqualTo("/votes");
    }
}
