with reuse_base as (
	select value_set_id from iterm.vocabulary_domain where name in (
		'AAAAAAAAAAAAAAAAA', 'BBBBBBBBBBBBBBBB' ) )

select * from 
(
	--vd via vs
	--vd to cc via vs part 1 of 2 (cc sub-branch)
	select coded_concept_id, description from (
		select max(version) over (partition by coded_concept_id) as max_version, coded_concept_id, description, version from (
			select version, description, coded_concept_id from iterm.concept_description where description_language = 'en' and coded_concept_id = any (
				select coded_concept_id from iterm.value_set_entry where from_value_set_id = any (
					select value_set_id from iterm.value_set_entry where from_value_set_id =any (
						select value_set_id from reuse_base)))))
	where max_version = version

	union

	--vd to cc via vs part 2 of 2 (cs sub-branch) 
	select coded_concept_id, description from (
		select max(version) over (partition by coded_concept_id) as max_version, coded_concept_id, description, version from (
			select version, description, coded_concept_id from iterm.concept_description where description_language = 'en' and coded_concept_id = any (
				select coded_concept_id from iterm.code_set_entry where code_set_id = any (
					select code_set_id from iterm.value_set_entry where value_set_id = any (
						select value_set_id from reuse_base)))))
	where max_version = version

);
--union
--...
--stuff.