-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : dim. 28 juin 2026 à 19:16
-- Version du serveur : 5.7.24
-- Version de PHP : 8.3.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `projet`
--

-- --------------------------------------------------------

--
-- Structure de la table `historique_factures`
--

CREATE TABLE `historique_factures` (
  `id` int(11) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `date_facture` date NOT NULL,
  `nom_patient` varchar(255) NOT NULL,
  `prenom_patient` varchar(255) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `statut` varchar(20) NOT NULL DEFAULT 'envoye',
  `cree_le` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- Structure de la table `identification`
--

CREATE TABLE `identification` (
  `identifiant` varchar(255) NOT NULL,
  `MDP` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Déchargement des données de la table `identification`
--

INSERT INTO `identification` (`identifiant`, `MDP`) VALUES
('Lilian@gmail.com', '$2a$12$ycLnmNOQhfLgH1t7qeT7Q.i6NUuYBBQC9WV/UvOu48QHeyIrk/ls2');

-- --------------------------------------------------------

--
-- Structure de la table `lignes_facture`
--

CREATE TABLE `lignes_facture` (
  `id` int(11) NOT NULL,
  `numero_facture` varchar(20) NOT NULL,
  `date_facture` date NOT NULL,
  `description` varchar(500) NOT NULL,
  `prix_unitaire` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `historique_factures`
--
ALTER TABLE `historique_factures`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `lignes_facture`
--
ALTER TABLE `lignes_facture`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero_facture` (`numero_facture`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `historique_factures`
--
ALTER TABLE `historique_factures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `lignes_facture`
--
ALTER TABLE `lignes_facture`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
