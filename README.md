# Twitter Clone (API)

This exercise aims to implement the following features of Twitter's API.

- User signup
- User sign in (using JWT)
- Post tweet
- Reply to tweet
- Follow other users
- View own timeline
- Search (Tweets and Users)

Together with the implementation, the API documentation is provided in the OpenAPI format. This implementation is an exercise in REST API design.
The API documentation is available on SwaggerHub at [Twitter Clone (API)](https://app.swaggerhub.com/apis/barisere/twitter_clone_api/0.1.0).

## Primary Resources

The API is designed around two primary resources: Accounts and Tweets.

Accounts are identified by unique usernames.
If account A follows account B, B's username is added to A's `following` list.

Tweets are associated with accounts. Replies to tweets are also tweets themselves, but with additional information identifying the tweet being replied.

You can search for accounts and tweets using the search endpoint (/search). Searching is powered by MongoDB's text indexes. Account usernames, and tweets' message and author, are indexed. For tweets, the message is given more priority than the author, so a message tweet that has relevant information in its message text gets ranked higher than a tweet that has same information in its author information.

### API Responses

Whenever the API returns data with a status code in the range [200, 400) (exclusive upper bound), the data is contained in the `data` field. For error responses, the error information is contained in the `error` field. Both fields are mutually exclusive. Most error responses have an additional error code attached in the `error.code` field.

## Implementation Technologies

1. The JavaScript programming language, and the Node.js platform.
2. The Nest.js web framework for Node.js.
3. MongoDB for data persistence.
4. The Mongoose Object-Document Mapper (ODM) was used to enable quick prototyping.
5. Jest, the JavaScript testing framework.

## Testing

Tests for this prototype are written as integration tests. An in-memory, bundled instance of MongoDB can be used to run the tests. This keeps the setup overhead small, and the tests can also be run in a regular continuous integration pipeline.

To run the tests, run the following command line.

```sh
npm run test:e2e
```

To start the application, provide a running MongoDB instance, then run the following command line.

```sh
npm run start
```

A `docker-compose.yml` file is provided with a simple setup for running a MongoDB instance as a docker container. You can start it by running `docker-compose up`. You will need the `docker-compose` tool for this.

## Documentation

The API documentation can be viewed as an HTML page (using SwaggerUI) by running the application and navigation to the "/api-doc" path. Navigating to the "/api-doc-json" path will produce the documentation in JSON, format.

## Possible improvements

1. The integration tests have some implicit coupling by using shared database state across some tests. Some of that shared state is desirable, in order to reduce setup/teardown overhead. The shared state should be made explicit.

2. The API documentation is auto-generated, and it is spread across the entire code base. Having it in one module can be better a approach.

3. There is no strict architectural pattern used here, although there is some resemblance to MVC. Adopting an architectural pattern can make the project easier to navigate.

4. There is no length restriction on account usernames. That I forgot something so important is humiliating.
