// SPDX-License-Identifier: GPL-3.0

/// @title A library used to construct ERC721 token URIs and SVG images

/*********************************
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░██░░░████░░██░░░████░░░ *
 * ░░██████░░░████████░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░██░░██░░░████░░██░░░████░░░ *
 * ░░░░░░█████████░░█████████░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 * ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ *
 *********************************/

pragma solidity ^0.8.17;

import { ISVGRenderer } from '../interfaces/ISVGRenderer.sol';

library NFTDescriptorV2 {
    struct TokenURIParams {
        string name;
        string description;
        string background;
        ISVGRenderer.Part[] parts;
    }

    /**
     * @notice Construct an ERC721 token URI.
     */
    function constructTokenURI(ISVGRenderer renderer, TokenURIParams memory params, bool isOriginal, string memory generation)
        public
        view
        returns (string memory)
    {
        string memory image = generateSVGImage(
            renderer,
            ISVGRenderer.SVGParams({ parts: params.parts, background: params.background })
        );

        // prettier-ignore
        return string.concat(
            'data:application/json,',
            '%7B%22name%22%3A%22', params.name,
            '%22%2C%20%22description%22%3A%22', params.description,
            '%22%2C%20%22image%22%3A%20%22', 'data%3Aimage%2Fsvg%2Bxml%2C', image,
            '%22%2C%22attributes%22%3A%5B%7B%22trait_type%22%3A%22Type%22%2C%22value%22%3A%22',
            isOriginal ? 'Original' : 'Random',
            '%22%7D%2C%7B%22display_type%22%3A%22number%22%2C%22trait_type%22%3A%22Generation%22%2C%22value%22%3A',
            generation,
            '%7D%5D%7D'
        );
    }

    /**
     * @notice Generate an SVG image for use in the ERC721 token URI.
     */
    function generateSVGImage(ISVGRenderer renderer, ISVGRenderer.SVGParams memory params)
        public
        view
        returns (string memory svg)
    {
        return renderer.generateSVG(params);
    }
}
