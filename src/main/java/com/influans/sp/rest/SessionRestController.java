package com.influans.sp.rest;

import com.influans.sp.dto.SessionDto;
import com.influans.sp.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class SessionRestController {

    @Autowired
    private SessionService sessionService;

    /**
     * @param sessionId sessionId
     * @return SessionDto
     * @should return 200 status
     * @should return valid error status if an exception has been thrown
     */
    @RequestMapping(value = "/sessions/{sessionId}", method = RequestMethod.GET)
    @ResponseBody
    public ResponseEntity<SessionDto> getSession(@PathVariable("sessionId") String sessionId) {
        return new ResponseEntity<>(sessionService.getSession(sessionId), HttpStatus.OK);
    }

    /**
     * @param sessionDto Session that will be created
     * @return SessionDto
     * @should return 200 status
     * @should return valid error status if an exception has been thrown
     */
    @RequestMapping(value = "/sessions", method = RequestMethod.POST)
    @ResponseBody
    public ResponseEntity<SessionDto> createSession(@RequestBody SessionDto sessionDto) {
        return new ResponseEntity<>(sessionService.createSession(sessionDto), HttpStatus.OK);
    }
}