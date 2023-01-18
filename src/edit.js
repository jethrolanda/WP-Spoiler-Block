import { useEffect, useState, useCallback } from '@wordpress/element';
import { Placeholder, TextControl, Button, RadioControl, Spinner } from '@wordpress/components';
import { Icon, check, more } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useEntityRecord } from '@wordpress/core-data';
/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({ attributes, setAttributes, isSelected }) {
	
	const [spoilers, setSpoilers] = useState([]);
	const [option, setOption] = useState(attributes?.value);
	const controller = typeof AbortController === 'undefined' ? undefined : new AbortController();

	const { record, isResolving } = useEntityRecord( 'postType', 'spoiler', option );

	const onDone = useCallback(() => {
		let val = spoilers.find(o => (o.value === option) );
		setAttributes( { editMode: false, content: val?.content ?? '', value: option } );
	}, [spoilers, option]);

	// ALTERNATIVE way of fetching posts/custom post types
	// const posts = useSelect( ( select ) => {
	// 	return select( 'core' ).getEntityRecords( 'postType', 'spoiler', { per_page: -1 } );
	// }, [] );

	useEffect(()=> {
		if(attributes.editMode){
			
			apiFetch( { path: '/wp/v2/spoiler?status=publish&posts_per_page=-1', signal: controller?.signal } ).then( ( posts ) => {
				let data = [];
				posts.forEach( (post, i) => {
					if(i === 0){
						setOption(post?.id)
					}
					data = [ ...data, {
						label: post?.title?.rendered,
						value: post?.id,
						content: post?.content?.rendered
					}];
				});
				setSpoilers(data);
			}).catch(
					( error ) => {
							// If the browser doesn't support AbortController then the code below will never log.
							// However, in most cases this should be fine as it can be considered to be a progressive enhancement.
							if ( error.name === 'AbortError' ) {
								setSpoilers([]);
							}
					}
			);
		}
	}, []);
	
	if(attributes.editMode) {

		return <Placeholder { ...useBlockProps() } instructions="Select one of the spoiler from the list you want to display." label={__( 'Spoiler List', 'wp-spoiler-block' )}>
			<div className="wps-spoiler-block">
				{/* <TextControl
					label="Search Spoiler"
					onChange={function noRefCheck(){}}
				/> */}
				{spoilers.length === 0 ? <Spinner /> : <RadioControl
					className='wps-spoiler-choices'
					onChange={(value)=>setOption(parseInt(value))}
					options={spoilers}
					selected={option}
				/>}
				
				<Button className="wps-spoiler-submit" variant="primary" onClick={onDone}>Done</Button>
			</div>
		</Placeholder>;

	} else {

		if(isResolving) {
			return <p { ...useBlockProps()}>
			<Spinner />
		</p>;	
		} else {
			return <p { ...useBlockProps()}>
				<span className="wps-spoiler" dangerouslySetInnerHTML={{ __html: record?.content?.rendered }} />
			</p>;	
		}

	}

}
