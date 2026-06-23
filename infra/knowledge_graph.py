import os
from neo4j import GraphDatabase

class IndusKnowledgeGraph:
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "indus_graph_secure")
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def merge_node(self, label: str, node_type: str, properties: dict = None):
        """
        Merge an industrial node (Equipment, Standard, Hazard, Location, Sensor) securely.
        """
        properties = properties or {}
        # Cypher query mapping dynamic node injection safely
        query = f"""
        MERGE (n:{node_type} {{label: $label}})
        ON CREATE SET n += $properties, n.created_at = timestamp()
        ON MATCH SET n += $properties, n.updated_at = timestamp()
        RETURN n
        """
        with self.driver.session() as session:
            session.run(query, label=label, properties=properties)

    def merge_relationship(self, source_label: str, source_type: str, 
                           target_label: str, target_type: str, 
                           rel_label: str, properties: dict = None):
        """
        Connect industrial concepts with semantic associations.
        """
        properties = properties or {}
        # Cypher query connecting source to target with specific relationship edge
        query = f"""
        MATCH (a:{source_type} {{label: $source_label}})
        MATCH (b:{target_type} {{label: $target_label}})
        MERGE (a)-[r:{rel_label}]->(b)
        ON CREATE SET r += $properties
        ON MATCH SET r += $properties
        RETURN r
        """
        with self.driver.session() as session:
            session.run(query, source_label=source_label, target_label=target_label, properties=properties)

    def find_hazard_dependencies(self, equipment_label: str):
        """
        Query safety paths linking equipment directly to hazards and mitigation standards.
        """
        query = """
        MATCH (e:Equipment {label: $label})-[r:CAUSES]->(h:Hazard)
        OPTIONAL MATCH (s:Standard)-[:COMPLIES_WITH]-(e)
        RETURN e.label AS Equipment, h.label AS Hazard, h.severity AS ThreatLevel, s.label AS StandardRequirement
        """
        with self.driver.session() as session:
            result = session.run(query, label=equipment_label)
            return [record.data() for record in result]
