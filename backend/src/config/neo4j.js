const neo4j =
    require("neo4j-driver");


if (!process.env.NEO4J_URI) {

    throw new Error(
        "NEO4J_URI is missing from .env"
    );

}


if (!process.env.NEO4J_USERNAME) {

    throw new Error(
        "NEO4J_USERNAME is missing from .env"
    );

}


if (!process.env.NEO4J_PASSWORD) {

    throw new Error(
        "NEO4J_PASSWORD is missing from .env"
    );

}


const driver = neo4j.driver(

    process.env.NEO4J_URI,

    neo4j.auth.basic(

        process.env.NEO4J_USERNAME,

        process.env.NEO4J_PASSWORD

    )

);


module.exports = driver;