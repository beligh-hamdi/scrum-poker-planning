package com.influans.sp.config;

import com.influans.sp.websocket.WebSocketSender;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import static org.mockito.Mockito.mock;

@Configuration
public class WebsocketTestConfig {
    @Bean
    @Profile("test")
    public WebSocketSender dummyWebSocketSender() {
        return mock(WebSocketSender.class);
    }

}
